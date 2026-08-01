/* Animated hero — "一梭成布，一布成市".
 *
 * The scene tells the Skill's own story in four layers:
 *   1. the lattice          your methodology, still raw material
 *   2. the shuttle          the Agent, weaving it into a product pass by pass
 *   3. the rising tiles     finished Skills detaching, going off to be installed
 *   4. the returning sparks revenue flowing back to the centre
 *
 * Layers 3 and 4 are one closed loop: every tile that leaves sends a spark
 * back, which is the whole point of the product — it is a business, not a demo.
 *
 * Degrades to the static SVG fallback without WebGL, renders a single still
 * frame under prefers-reduced-motion, and pauses when scrolled out of view.
 */
(function () {
  var mount = document.getElementById('hero-canvas');
  var fallback = document.getElementById('hero-fallback');
  if (!mount || typeof THREE === 'undefined') return;

  var probe = document.createElement('canvas').getContext('webgl');
  if (!probe) return;

  if (fallback) fallback.style.display = 'none';
  mount.style.display = 'block';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Phones get a coarser lattice and a lower pixel-ratio ceiling. The scene
  // reads the same at hero size and costs roughly half the fragments.
  var small = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
  var COLS = small ? 32 : 46;
  var ROWS = COLS;
  var SPAN = 13;
  var HALF = SPAN / 2;
  var CRIMSON = 0x8e2233;
  var EMBER = 0xe8b06a;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 120);
  camera.position.set(0, -0.6, 15.5);

  var renderer = new THREE.WebGLRenderer({ canvas: mount, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);

  // Shared by every layer so the whole scene breathes on one clock.
  var uniforms = {
    uTime: { value: 0 },
    uPixelRatio: { value: 1 },
    uShuttleY: { value: -HALF },
    uWeaveAmp: { value: 0 },
    uColorA: { value: new THREE.Color(CRIMSON) },
    uColorB: { value: new THREE.Color(EMBER) }
  };

  // The surface equation lives in both GLSL and JS: the shader displaces the
  // lattice with it, and the CPU needs it to launch tiles from the cloth face.
  function surface(x, y, t) {
    return Math.sin(x * 0.55 + t * 0.85) * 0.52
      + Math.sin(y * 0.44 - t * 0.62) * 0.52
      + Math.sin((x + y) * 0.30 + t * 0.40) * 0.34;
  }

  var GLSL_SURFACE = [
    'uniform float uTime;',
    'uniform float uShuttleY;',
    'uniform float uWeaveAmp;',
    'varying float vH;',
    'varying float vD;',
    'varying float vWoven;',
    'vec3 warp(vec3 p){',
    '  float w = sin(p.x * 0.55 + uTime * 0.85) * 0.52',
    '          + sin(p.y * 0.44 - uTime * 0.62) * 0.52',
    '          + sin((p.x + p.y) * 0.30 + uTime * 0.40) * 0.34;',
    '  vH = w;',
    '  vD = length(p.xy);',
    // Rows the shuttle has already crossed glow warm and fade with distance
    // behind it; rows ahead of it stay cold. This is the progress bar.
    '  float behind = uShuttleY - p.y;',
    '  vWoven = uWeaveAmp * step(0.0, behind) * (1.0 - smoothstep(0.0, 5.0, behind));',
    '  p.z += w;',
    '  return p;',
    '}'
  ].join('\n');

  var GLSL_TINT = [
    'uniform vec3 uColorA;',
    'uniform vec3 uColorB;',
    'varying float vH;',
    'varying float vD;',
    'varying float vWoven;',
    'vec3 tint(){',
    '  vec3 base = mix(uColorA, uColorB, clamp(vH * 0.55 + 0.5, 0.0, 1.0));',
    '  return mix(base, uColorB, vWoven * 0.75);',
    '}',
    'float fade(){ return smoothstep(9.2, 2.4, vD); }'
  ].join('\n');

  /* ---- layer 1: the lattice ---- */

  var pointsMat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: [
      'attribute float aRand;',
      GLSL_SURFACE,
      'uniform float uPixelRatio;',
      'void main(){',
      '  vec4 mv = modelViewMatrix * vec4(warp(position), 1.0);',
      '  gl_PointSize = (1.6 + aRand * 2.1 + vWoven * 1.6) * uPixelRatio * (10.0 / -mv.z);',
      '  gl_Position = projectionMatrix * mv;',
      '}'
    ].join('\n'),
    fragmentShader: [
      GLSL_TINT,
      'void main(){',
      '  float d = length(gl_PointCoord - 0.5);',
      '  if (d > 0.5) discard;',
      '  float a = smoothstep(0.5, 0.02, d) * fade() * (0.62 + vWoven * 0.9);',
      '  gl_FragColor = vec4(tint(), a);',
      '}'
    ].join('\n')
  });

  var linesMat = new THREE.ShaderMaterial({
    uniforms: uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: [
      GLSL_SURFACE,
      'void main(){',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(warp(position), 1.0);',
      '}'
    ].join('\n'),
    fragmentShader: [
      GLSL_TINT,
      'void main(){',
      '  gl_FragColor = vec4(tint(), (0.16 + vWoven * 0.42) * fade());',
      '}'
    ].join('\n')
  });

  function node(c, r) {
    return [(c / (COLS - 1) - 0.5) * SPAN, (r / (ROWS - 1) - 0.5) * SPAN];
  }

  var pos = new Float32Array(COLS * ROWS * 3);
  var rand = new Float32Array(COLS * ROWS);
  var n = 0;
  for (var r = 0; r < ROWS; r++) {
    for (var c = 0; c < COLS; c++) {
      var xy = node(c, r);
      pos[n * 3] = xy[0];
      pos[n * 3 + 1] = xy[1];
      pos[n * 3 + 2] = 0;
      rand[n] = Math.random();
      n++;
    }
  }
  var pointsGeo = new THREE.BufferGeometry();
  pointsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pointsGeo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));

  // Warp (vertical) and weft (horizontal) drawn as one segment soup.
  var seg = [];
  for (var rr = 0; rr < ROWS; rr++) {
    for (var cc = 0; cc < COLS; cc++) {
      var a = node(cc, rr);
      if (cc < COLS - 1) {
        var b = node(cc + 1, rr);
        seg.push(a[0], a[1], 0, b[0], b[1], 0);
      }
      if (rr < ROWS - 1) {
        var d = node(cc, rr + 1);
        seg.push(a[0], a[1], 0, d[0], d[1], 0);
      }
    }
  }
  var linesGeo = new THREE.BufferGeometry();
  linesGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(seg), 3));

  var group = new THREE.Group();
  group.add(new THREE.LineSegments(linesGeo, linesMat));
  group.add(new THREE.Points(pointsGeo, pointsMat));

  /* ---- layer 2: the shuttle ---- */

  // An octahedron squashed along x reads as a shuttle: pointed at both ends.
  var shuttleGeo = new THREE.OctahedronGeometry(0.24, 0);
  shuttleGeo.scale(2.5, 0.5, 0.45);
  var shuttle = new THREE.Mesh(
    shuttleGeo,
    new THREE.MeshBasicMaterial({ color: EMBER, transparent: true, opacity: 0.95 })
  );
  group.add(shuttle);

  var TRAIL = 20;
  var trailPos = new Float32Array(TRAIL * 3);
  var trailAge = new Float32Array(TRAIL);
  for (var ti = 0; ti < TRAIL; ti++) trailAge[ti] = 1;
  var trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  trailGeo.setAttribute('aAge', new THREE.BufferAttribute(trailAge, 1));
  var trail = new THREE.Points(trailGeo, new THREE.ShaderMaterial({
    uniforms: { uPixelRatio: uniforms.uPixelRatio, uColor: { value: new THREE.Color(EMBER) } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: [
      'attribute float aAge;',
      'uniform float uPixelRatio;',
      'varying float vA;',
      'void main(){',
      '  vA = 1.0 - aAge;',
      '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
      '  gl_PointSize = (1.0 + vA * 5.0) * uPixelRatio * (10.0 / -mv.z);',
      '  gl_Position = projectionMatrix * mv;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform vec3 uColor;',
      'varying float vA;',
      'void main(){',
      '  float d = length(gl_PointCoord - 0.5);',
      '  if (d > 0.5) discard;',
      '  gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * vA * 0.75);',
      '}'
    ].join('\n')
  }));
  group.add(trail);

  /* ---- layers 3 and 4: products leaving, revenue returning ---- */

  var CYCLES = 8;
  var flowPos = new Float32Array(CYCLES * 2 * 3);
  var flowAlpha = new Float32Array(CYCLES * 2);
  var flowSize = new Float32Array(CYCLES * 2);
  var flowTone = new Float32Array(CYCLES * 2);
  var flowGeo = new THREE.BufferGeometry();
  flowGeo.setAttribute('position', new THREE.BufferAttribute(flowPos, 3));
  flowGeo.setAttribute('aAlpha', new THREE.BufferAttribute(flowAlpha, 1));
  flowGeo.setAttribute('aSize', new THREE.BufferAttribute(flowSize, 1));
  flowGeo.setAttribute('aTone', new THREE.BufferAttribute(flowTone, 1));

  var flow = new THREE.Points(flowGeo, new THREE.ShaderMaterial({
    uniforms: {
      uPixelRatio: uniforms.uPixelRatio,
      uColorA: { value: new THREE.Color(0xb8323f) },
      uColorB: { value: new THREE.Color(EMBER) }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: [
      'attribute float aAlpha;',
      'attribute float aSize;',
      'attribute float aTone;',
      'uniform float uPixelRatio;',
      'varying float vA;',
      'varying float vT;',
      'void main(){',
      '  vA = aAlpha;',
      '  vT = aTone;',
      '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
      '  gl_PointSize = aSize * uPixelRatio * (10.0 / -mv.z);',
      '  gl_Position = projectionMatrix * mv;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform vec3 uColorA;',
      'uniform vec3 uColorB;',
      'varying float vA;',
      'varying float vT;',
      'void main(){',
      // Products render as soft squares (a packaged thing); revenue as round
      // sparks. One material, two readings.
      '  vec2 q = gl_PointCoord - 0.5;',
      '  float box = 1.0 - smoothstep(0.34, 0.5, max(abs(q.x), abs(q.y)));',
      '  float dot = smoothstep(0.5, 0.0, length(q));',
      '  float m = mix(box, dot, vT);',
      '  if (m <= 0.001) discard;',
      '  gl_FragColor = vec4(mix(uColorA, uColorB, mix(0.35, 1.0, vT)), m * vA);',
      '}'
    ].join('\n')
  }));
  group.add(flow);

  // Each cycle owns a product (index i) and the spark it sends back (index
  // CYCLES + i), offset half a period apart so the loop always reads as
  // "something went out, something came back".
  var cycles = [];
  for (var ci = 0; ci < CYCLES; ci++) {
    cycles.push({ offset: ci / CYCLES, x: 0, y: 0, prev: 0, rx: 0, rz: 0 });
  }

  function respawn(cy, t) {
    // Products detach from cloth the shuttle has just finished.
    cy.x = (Math.random() - 0.5) * 8.5;
    cy.y = uniforms.uShuttleY.value - 0.6 - Math.random() * 4.2;
    if (cy.y < -HALF) cy.y += SPAN;
    cy.rx = (Math.random() - 0.5) * 11;
    cy.rz = 5.5 + Math.random() * 2.5;
    cy.seed = t;
  }
  for (var cj = 0; cj < CYCLES; cj++) respawn(cycles[cj], 0);

  group.rotation.x = -1.02;
  group.rotation.z = 0.22;
  scene.add(group);

  var baseX = group.rotation.x;
  var baseZ = group.rotation.z;
  var targetX = 0;
  var targetY = 0;
  var curX = 0;
  var curY = 0;

  function resize() {
    var w = mount.clientWidth || mount.parentNode.clientWidth;
    var h = mount.clientHeight || Math.round(w * 0.75);
    if (!w || !h) return;
    var ratio = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h, false);
    uniforms.uPixelRatio.value = ratio;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  window.addEventListener('resize', resize);
  resize();

  if (!reduce) {
    mount.parentNode.addEventListener('pointermove', function (e) {
      var rect = mount.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });
    mount.parentNode.addEventListener('pointerleave', function () {
      targetX = 0;
      targetY = 0;
    });
  }

  var running = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
    }).observe(mount);
  }

  var PASS = 12;      // seconds for the cloth to advance one full height
  var SWEEP = 1.55;   // shuttle crossings per second

  function update(t) {
    uniforms.uTime.value = t;

    // Shuttle: crosses back and forth while the cloth advances under it.
    var cyc = (t / PASS) % 1;
    var sy = -HALF + cyc * SPAN;
    var sx = Math.sin(t * SWEEP) * (HALF - 1.4);
    var sz = surface(sx, sy, t) + 0.3;
    uniforms.uShuttleY.value = sy;
    // Fade the "already woven" glow across the wrap so the reset never snaps.
    uniforms.uWeaveAmp.value =
      Math.min(1, cyc / 0.08) * Math.min(1, (1 - cyc) / 0.08);

    shuttle.position.set(sx, sy, sz);
    shuttle.rotation.z = Math.cos(t * SWEEP) > 0 ? 0.08 : -0.08;

    // Trail: shift the ring back one slot, write the head, age everything.
    for (var i = TRAIL - 1; i > 0; i--) {
      trailPos[i * 3] = trailPos[(i - 1) * 3];
      trailPos[i * 3 + 1] = trailPos[(i - 1) * 3 + 1];
      trailPos[i * 3 + 2] = trailPos[(i - 1) * 3 + 2];
      trailAge[i] = Math.min(1, trailAge[i - 1] + 0.05);
    }
    trailPos[0] = sx;
    trailPos[1] = sy;
    trailPos[2] = sz;
    trailAge[0] = 0;
    trailGeo.attributes.position.needsUpdate = true;
    trailGeo.attributes.aAge.needsUpdate = true;

    // Products rise off the cloth; each sends a spark back to the centre.
    for (var k = 0; k < CYCLES; k++) {
      var cy = cycles[k];
      var p = ((t / 9) + cy.offset) % 1;
      if (p < cy.prev) respawn(cy, t);
      cy.prev = p;

      var out = Math.min(1, p / 0.5);
      var back = Math.max(0, (p - 0.5) / 0.5);

      // outbound product
      var oz = surface(cy.x, cy.y, t) + out * 7.5;
      flowPos[k * 3] = cy.x + out * cy.rx * 0.22;
      flowPos[k * 3 + 1] = cy.y + out * 1.1;
      flowPos[k * 3 + 2] = oz;
      flowAlpha[k] = Math.min(1, out / 0.14) * (1 - Math.min(1, Math.max(0, (out - 0.55) / 0.45)));
      flowSize[k] = 5.2 - out * 2.2;
      flowTone[k] = 0;

      // inbound revenue, converging on the centre of the cloth
      var j = CYCLES + k;
      var e = back * back * (3 - 2 * back);
      flowPos[j * 3] = cy.rx * (1 - e);
      flowPos[j * 3 + 1] = (cy.y + 4.5) * (1 - e);
      flowPos[j * 3 + 2] = cy.rz * (1 - e) + surface(0, 0, t) * e;
      flowAlpha[j] = back <= 0 ? 0
        : Math.min(1, back / 0.12) * (1 - Math.min(1, Math.max(0, (back - 0.78) / 0.22)));
      flowSize[j] = 2.4 + back * 2.6;
      flowTone[j] = 1;
    }
    flowGeo.attributes.position.needsUpdate = true;
    flowGeo.attributes.aAlpha.needsUpdate = true;
    flowGeo.attributes.aSize.needsUpdate = true;
    flowGeo.attributes.aTone.needsUpdate = true;
  }

  var start = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    if (!running) return;
    update((now - start) / 1000);
    curX += (targetX - curX) * 0.05;
    curY += (targetY - curY) * 0.05;
    group.rotation.x = baseX + curY * 0.16;
    group.rotation.z = baseZ + curX * 0.18;
    renderer.render(scene, camera);
  }

  if (reduce) {
    update(3.6);
    renderer.render(scene, camera);
  } else {
    requestAnimationFrame(frame);
  }
})();
