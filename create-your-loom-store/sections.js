/* Section visuals — three 2D-canvas scenes that continue the hero's story.
 *
 *   pipeline  (#roadmap) loose threads converge into one bright band and leave
 *                        as discrete product tiles: a production line
 *   gates     (#gates)   a particle stream halts at four barriers until each
 *                        one opens: nothing costs money without your say-so
 *   converge  (final)    threads from every direction collapse into one point:
 *                        an idea becoming a single business
 *
 * These deliberately use 2D canvas rather than WebGL. The hero already holds a
 * WebGL context; browsers cap how many a page may have, and line work this
 * simple costs far less drawn directly. All three pause off-screen and render
 * one still frame under prefers-reduced-motion.
 */
(function () {
  var CRIM = '184,50,63';
  var EMB = '232,176,106';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ease(u) { return u * u * (3 - 2 * u); }
  function mix(a, b, u) { return a + (b - a) * u; }
  function rgba(c, a) { return 'rgba(' + c + ',' + a + ')'; }

  function mount(canvas, factory) {
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;
    var scene = null;
    var running = true;
    var last = 0;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene = factory(rect.width, rect.height);
      if (reduce) scene.draw(ctx, 2.6, 0.016);
    }

    window.addEventListener('resize', resize);
    resize();
    if (reduce) return;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        running = entries[0].isIntersecting;
      }).observe(canvas);
    }

    var t0 = performance.now();
    (function frame(now) {
      requestAnimationFrame(frame);
      if (!running || !scene) return;
      var t = (now - t0) / 1000;
      var dt = Math.min(0.05, last ? t - last : 0.016);
      last = t;
      scene.draw(ctx, t, dt);
    })(t0);
  }

  /* ---- pipeline: raw threads in, finished product out ---- */

  function pipeline(w, h) {
    var THREADS = 9;
    var mid = h / 2;
    var stages = [0.125, 0.375, 0.625, 0.875];

    // Threads start loose and wide, then tighten into a single band. The
    // convergence is the whole point: scattered method becomes one product.
    function threadY(i, x, t) {
      var u = x / w;
      var conv = ease(Math.min(1, u * 1.05));
      var spread = (i - (THREADS - 1) / 2) * (h * 0.055) * (1 - conv * 0.92);
      var amp = h * 0.16 * (1 - conv * 0.88);
      return mid + spread + Math.sin(x * 0.014 + t * 1.15 + i * 0.72) * amp;
    }

    var grad = null;

    return {
      draw: function (ctx, t) {
        ctx.clearRect(0, 0, w, h);
        if (!grad) {
          grad = ctx.createLinearGradient(0, 0, w, 0);
          grad.addColorStop(0, rgba(CRIM, 0.30));
          grad.addColorStop(0.62, rgba(CRIM, 0.55));
          grad.addColorStop(1, rgba(EMB, 0.72));
        }

        ctx.lineWidth = 1;
        ctx.strokeStyle = grad;
        for (var i = 0; i < THREADS; i++) {
          ctx.beginPath();
          for (var x = 0; x <= w; x += 5) {
            var y = threadY(i, x, t);
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        // Stage ticks, aligned with the four workflow columns below.
        for (var s = 0; s < stages.length; s++) {
          var sx = stages[s] * w;
          ctx.strokeStyle = rgba('255,255,255', 0.10);
          ctx.beginPath();
          ctx.moveTo(sx, h * 0.14);
          ctx.lineTo(sx, h * 0.86);
          ctx.stroke();
        }

        ctx.globalCompositeOperation = 'lighter';

        // Pulses of work travelling down the line.
        for (var p = 0; p < 5; p++) {
          var u = ((t * 0.17) + p / 5) % 1;
          var px = u * w;
          var pi = (p * 2) % THREADS;
          var py = threadY(pi, px, t);
          var warm = ease(u);
          var col = 'rgba(' + Math.round(mix(184, 232, warm)) + ',' +
            Math.round(mix(50, 176, warm)) + ',' +
            Math.round(mix(63, 106, warm)) + ',';
          var r = 2.2 + warm * 2.2;
          var g2 = ctx.createRadialGradient(px, py, 0, px, py, r * 5);
          g2.addColorStop(0, col + '0.95)');
          g2.addColorStop(1, col + '0)');
          ctx.fillStyle = g2;
          ctx.beginPath();
          ctx.arc(px, py, r * 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Finished units leaving the right-hand end.
        for (var q = 0; q < 4; q++) {
          var v = ((t * 0.24) + q / 4) % 1;
          if (v < 0.78) continue;
          var k = (v - 0.78) / 0.22;
          var tx = w * 0.9 + k * w * 0.12;
          var ty = mid + Math.sin(q * 2.1) * h * 0.09 * k;
          var size = 6 - k * 2;
          ctx.fillStyle = rgba(EMB, (1 - k) * 0.85);
          ctx.fillRect(tx - size / 2, ty - size / 2, size, size);
        }

        ctx.globalCompositeOperation = 'source-over';
      }
    };
  }

  /* ---- gates: the stream stops until you confirm ---- */

  function gates(w, h) {
    var GATES = [0.2, 0.4, 0.6, 0.8].map(function (u) { return u * w; });
    var COUNT = Math.max(40, Math.round(w / 11));
    var parts = [];
    for (var i = 0; i < COUNT; i++) {
      parts.push({
        x: Math.random() * w,
        y: h * 0.22 + Math.random() * h * 0.56,
        v: 22 + Math.random() * 26,
        j: Math.random() * 6.28
      });
    }

    // Each gate opens on its own stagger, so at any moment some are holding
    // and some are letting work through.
    function openness(i, t) {
      var c = ((t * 0.32) + i * 0.22) % 1;
      return c > 0.68 ? Math.min(1, (c - 0.68) / 0.1) * Math.min(1, (1 - c) / 0.08) : 0;
    }

    function nextGate(x) {
      for (var i = 0; i < GATES.length; i++) if (GATES[i] > x + 1) return i;
      return -1;
    }

    return {
      draw: function (ctx, t, dt) {
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';

        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          var gi = nextGate(p.x);
          var blocked = gi >= 0 && openness(gi, t) < 0.5 && GATES[gi] - p.x < 14;
          if (blocked) {
            // Held at the gate, jittering — waiting on a human, not stuck.
            p.x += Math.sin(t * 6 + p.j) * 0.18;
            p.y += Math.cos(t * 4 + p.j) * 0.14;
          } else {
            p.x += p.v * dt;
          }
          if (p.x > w + 6) {
            p.x = -6;
            p.y = h * 0.22 + Math.random() * h * 0.56;
          }

          // Passing gates warms the particle: closer to published, closer to paid.
          var passed = 0;
          for (var g = 0; g < GATES.length; g++) if (p.x > GATES[g]) passed++;
          var warm = passed / GATES.length;
          ctx.fillStyle = 'rgba(' + Math.round(mix(184, 232, warm)) + ',' +
            Math.round(mix(50, 176, warm)) + ',' +
            Math.round(mix(63, 106, warm)) + ',' + (0.35 + warm * 0.45) + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5 + warm * 1.1, 0, Math.PI * 2);
          ctx.fill();
        }

        for (var k = 0; k < GATES.length; k++) {
          var gx = GATES[k];
          var o = openness(k, t);
          var top = h * 0.14;
          var bot = h * 0.86;
          var half = (bot - top) / 2;
          var gap = o * half * 0.82;
          ctx.lineWidth = o > 0.4 ? 1.4 : 2.2;
          ctx.strokeStyle = o > 0.4 ? rgba(EMB, 0.5 + o * 0.45) : rgba(CRIM, 0.55);
          ctx.beginPath();
          ctx.moveTo(gx, top);
          ctx.lineTo(gx, top + half - gap);
          ctx.moveTo(gx, bot - half + gap);
          ctx.lineTo(gx, bot);
          ctx.stroke();

          // The confirmation itself: a mark at the centre of the gate.
          var cy = (top + bot) / 2;
          ctx.fillStyle = o > 0.4 ? rgba(EMB, o) : rgba(CRIM, 0.7);
          ctx.beginPath();
          ctx.arc(gx, cy, o > 0.4 ? 1.6 : 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalCompositeOperation = 'source-over';
      }
    };
  }

  /* ---- converge: many threads, one business ---- */

  function converge(w, h) {
    var cx = w / 2;
    var cy = h / 2;
    var reach = Math.max(w, h) * 0.62;
    var COUNT = 70;
    var parts = [];
    for (var i = 0; i < COUNT; i++) {
      parts.push({
        a: Math.random() * Math.PI * 2,
        r: Math.random(),
        v: 0.06 + Math.random() * 0.1,
        curl: (Math.random() - 0.5) * 0.5
      });
    }

    return {
      draw: function (ctx, t, dt) {
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'lighter';

        var pulse = 0.5 + Math.sin(t * 1.3) * 0.5;
        var bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, reach * 0.3);
        bloom.addColorStop(0, rgba(EMB, 0.16 + pulse * 0.12));
        bloom.addColorStop(1, rgba(EMB, 0));
        ctx.fillStyle = bloom;
        ctx.fillRect(0, 0, w, h);

        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.r -= p.v * dt;
          p.a += p.curl * dt;
          if (p.r <= 0.02) {
            p.r = 1;
            p.a = Math.random() * Math.PI * 2;
          }
          var near = 1 - p.r;
          var r1 = p.r * reach;
          var r2 = Math.max(0, p.r - 0.06) * reach;
          var x1 = cx + Math.cos(p.a) * r1;
          var y1 = cy + Math.sin(p.a) * r1 * 0.62;
          var x2 = cx + Math.cos(p.a + p.curl * 0.2) * r2;
          var y2 = cy + Math.sin(p.a + p.curl * 0.2) * r2 * 0.62;
          ctx.strokeStyle = 'rgba(' + Math.round(mix(184, 232, near)) + ',' +
            Math.round(mix(50, 176, near)) + ',' +
            Math.round(mix(63, 106, near)) + ',' + (0.1 + near * 0.55) + ')';
          ctx.lineWidth = 0.6 + near * 1.2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        ctx.globalCompositeOperation = 'source-over';
      }
    };
  }

  /* ---- relay: you decide once, they grind constantly ---- */

  function relay(w, h) {
    // Hubs align with the three cards below: cloud, skill, you.
    var hub = [w / 6, w / 2, w * 5 / 6];
    var mid = h / 2;
    var ring = Math.min(h * 0.3, 34);

    // The cloud is a crowd; the skill is one orchestrator; you are one person.
    // That count asymmetry is the argument this scene has to make.
    var sats = [];
    for (var i = 0; i < 16; i++) {
      sats.push({
        a: (i / 16) * Math.PI * 2,
        r: 0.45 + Math.random() * 0.55,
        sp: 0.25 + Math.random() * 0.5,
        ph: Math.random() * 6.28
      });
    }

    var packets = [];
    var queue = [];
    var busy = 0;
    var spark = 0;
    var idle = 1.2;

    function send(from, to, kind, speed) {
      packets.push({ from: from, to: to, p: 0, sp: speed, kind: kind });
    }
    function later(delay, fn) { queue.push({ d: delay, fn: fn }); }

    function arrive(pk) {
      if (pk.kind === 'confirm') {
        // One confirmation fans out into a whole batch of cloud work.
        for (var i = 0; i < 7; i++) {
          (function (n) {
            later(n * 0.09, function () { send(1, 0, 'task', 0.85 + Math.random() * 0.3); });
          })(i);
        }
      } else if (pk.kind === 'task') {
        busy = Math.min(1.6, busy + 0.3);
        later(0.9 + Math.random() * 0.6, function () { send(0, 1, 'result', 0.9); });
      } else if (pk.kind === 'result') {
        later(0.12, function () { send(1, 2, 'value', 1.05); });
      } else if (pk.kind === 'value') {
        spark = 1;
      }
    }

    return {
      draw: function (ctx, t, dt) {
        ctx.clearRect(0, 0, w, h);

        idle -= dt;
        if (idle <= 0) {
          idle = 5.2;
          send(2, 1, 'confirm', 0.8);
        }
        for (var q = queue.length - 1; q >= 0; q--) {
          queue[q].d -= dt;
          if (queue[q].d <= 0) { queue[q].fn(); queue.splice(q, 1); }
        }
        busy = Math.max(0, busy - dt * 0.5);
        spark = Math.max(0, spark - dt * 1.4);

        // rail
        ctx.strokeStyle = rgba('255,255,255', 0.09);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hub[0], mid);
        ctx.lineTo(hub[2], mid);
        ctx.stroke();

        ctx.globalCompositeOperation = 'lighter';

        // hub 0 — the cloud, always working, brighter when a batch lands
        for (var s = 0; s < sats.length; s++) {
          var st = sats[s];
          var ang = st.a + t * st.sp;
          var rr = ring * st.r * (1 + Math.sin(t * 1.6 + st.ph) * 0.08);
          var sx = hub[0] + Math.cos(ang) * rr;
          var sy = mid + Math.sin(ang) * rr * 0.66;
          var lit = 0.3 + 0.3 * (0.5 + Math.sin(t * 3 + st.ph) * 0.5) + busy * 0.45;
          ctx.fillStyle = rgba(CRIM, Math.min(0.95, lit));
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5 + busy * 0.9, 0, Math.PI * 2);
          ctx.fill();
          if (s % 4 === 0) {
            ctx.strokeStyle = rgba(CRIM, 0.1 + busy * 0.22);
            ctx.beginPath();
            ctx.moveTo(hub[0], mid);
            ctx.lineTo(sx, sy);
            ctx.stroke();
          }
        }
        ctx.fillStyle = rgba(EMB, 0.35 + busy * 0.5);
        ctx.beginPath();
        ctx.arc(hub[0], mid, 2.6 + busy * 1.6, 0, Math.PI * 2);
        ctx.fill();

        // hub 1 — the orchestrator, one shuttle that never stops
        ctx.strokeStyle = rgba('255,255,255', 0.14);
        ctx.beginPath();
        ctx.arc(hub[1], mid, ring * 0.52, 0, Math.PI * 2);
        ctx.stroke();
        var swing = Math.sin(t * 2.1) * ring * 0.4;
        ctx.strokeStyle = rgba(EMB, 0.85);
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(hub[1] + swing - 5, mid);
        ctx.lineTo(hub[1] + swing + 5, mid);
        ctx.stroke();
        ctx.lineWidth = 1;

        // hub 2 — you, calm, emitting rarely
        var breathe = 0.45 + Math.sin(t * 1.1) * 0.12 + spark * 0.5;
        var yg = ctx.createRadialGradient(hub[2], mid, 0, hub[2], mid, ring * 0.9);
        yg.addColorStop(0, rgba(EMB, 0.28 * breathe + spark * 0.3));
        yg.addColorStop(1, rgba(EMB, 0));
        ctx.fillStyle = yg;
        ctx.beginPath();
        ctx.arc(hub[2], mid, ring * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = rgba(EMB, 0.3 + spark * 0.5);
        ctx.beginPath();
        ctx.arc(hub[2], mid, ring * 0.34, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = rgba(EMB, 0.7 + spark * 0.3);
        ctx.beginPath();
        ctx.arc(hub[2], mid, 3, 0, Math.PI * 2);
        ctx.fill();

        // packets in flight
        for (var k = packets.length - 1; k >= 0; k--) {
          var pk = packets[k];
          pk.p += pk.sp * dt;
          if (pk.p >= 1) { arrive(pk); packets.splice(k, 1); continue; }
          var e = ease(pk.p);
          var px = mix(hub[pk.from], hub[pk.to], e);
          var arc = Math.sin(pk.p * Math.PI) * (pk.kind === 'task' ? 9 : 15);
          var py = mid - (pk.kind === 'task' || pk.kind === 'confirm' ? arc : -arc);
          var warm = pk.kind === 'task' ? 0 : 1;
          var size = pk.kind === 'confirm' ? 3.4 : pk.kind === 'value' ? 2.8 : 2;
          var col = 'rgba(' + Math.round(mix(184, 232, warm)) + ',' +
            Math.round(mix(50, 176, warm)) + ',' +
            Math.round(mix(63, 106, warm)) + ',';
          var pg = ctx.createRadialGradient(px, py, 0, px, py, size * 4);
          pg.addColorStop(0, col + '0.9)');
          pg.addColorStop(1, col + '0)');
          ctx.fillStyle = pg;
          ctx.beginPath();
          ctx.arc(px, py, size * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalCompositeOperation = 'source-over';
      }
    };
  }

  /* ---- screen: many tickers in, a short ranked list out ---- */

  function screen(w, h) {
    // Mirrors what the case-study Skill actually does: a wide input crosses a
    // local evidence audit, most rows are rejected and fall away, and only the
    // survivors are ranked. "百里挑一" as a literal funnel.
    var gate = w * 0.46;
    var lane = h * 0.5;
    var top = h * 0.16;
    var bot = h * 0.84;
    var COUNT = Math.max(46, Math.round(w / 9));
    var BARS = 4;
    var bars = [0, 0, 0, 0];
    var flash = 0;
    var items = [];

    function spawn(p, seedX) {
      p.x = seedX;
      p.y = top + Math.random() * (bot - top);
      p.v = 26 + Math.random() * 22;
      p.pass = Math.random() < 0.22;
      p.drop = 0.5 + Math.random() * 1.6;
      p.done = false;
    }
    for (var i = 0; i < COUNT; i++) {
      var p = {};
      spawn(p, Math.random() * w * 0.9);
      items.push(p);
    }

    return {
      draw: function (ctx, t, dt) {
        ctx.clearRect(0, 0, w, h);
        flash = Math.max(0, flash - dt * 2.2);
        for (var b = 0; b < BARS; b++) bars[b] = Math.max(0, bars[b] - dt * 0.5);

        // the audit membrane
        var mg = ctx.createLinearGradient(gate - 10, 0, gate + 10, 0);
        mg.addColorStop(0, rgba(EMB, 0));
        mg.addColorStop(0.5, rgba(EMB, 0.14 + flash * 0.25));
        mg.addColorStop(1, rgba(EMB, 0));
        ctx.fillStyle = mg;
        ctx.fillRect(gate - 10, top - 6, 20, bot - top + 12);
        ctx.strokeStyle = rgba(EMB, 0.4 + flash * 0.4);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gate, top - 6);
        ctx.lineTo(gate, bot + 6);
        ctx.stroke();

        ctx.globalCompositeOperation = 'lighter';

        for (var k = 0; k < items.length; k++) {
          var it = items[k];
          var was = it.x;
          it.x += it.v * dt;

          if (it.pass) {
            // survivors converge into the ranked lane and warm up
            var u = Math.max(0, Math.min(1, (it.x - gate) / (w * 0.36)));
            it.y = mix(it.y, lane, ease(u) * 0.12);
            var warm = it.x < gate ? 0 : ease(u);
            ctx.fillStyle = 'rgba(' + Math.round(mix(184, 232, warm)) + ',' +
              Math.round(mix(50, 176, warm)) + ',' +
              Math.round(mix(63, 106, warm)) + ',' + (0.5 + warm * 0.45) + ')';
            ctx.beginPath();
            ctx.arc(it.x, it.y, 1.7 + warm * 1.5, 0, Math.PI * 2);
            ctx.fill();
            if (was <= gate && it.x > gate) flash = 1;
            if (it.x > w * 0.87 && !it.done) {
              it.done = true;
              bars[Math.floor(Math.random() * BARS)] = 1;
            }
          } else {
            // rejected rows sink and dim; they never reach the ranking
            var d = Math.max(0, it.x - gate);
            it.y += d * dt * it.drop * 0.5;
            var a = it.x < gate ? 0.5 : Math.max(0, 0.5 - d / (w * 0.3) * 0.5);
            if (a > 0.01) {
              ctx.fillStyle = rgba(CRIM, a);
              ctx.beginPath();
              ctx.arc(it.x, it.y, 1.6, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          if (it.x > w + 10 || it.y > h + 10) spawn(it, -8);
        }

        // the short list that comes out the other end
        for (var j = 0; j < BARS; j++) {
          var by = lane - 18 + j * 12;
          var bw = w * 0.09 * (1 - j * 0.16);
          ctx.fillStyle = rgba(EMB, 0.22 + bars[j] * 0.6);
          ctx.fillRect(w * 0.88, by, bw, 4);
        }

        ctx.globalCompositeOperation = 'source-over';
      }
    };
  }

  var scenes = {
    pipeline: pipeline,
    gates: gates,
    converge: converge,
    relay: relay,
    screen: screen
  };

  document.addEventListener('DOMContentLoaded', function () {
    var nodes = document.querySelectorAll('canvas[data-scene]');
    for (var i = 0; i < nodes.length; i++) {
      var factory = scenes[nodes[i].getAttribute('data-scene')];
      if (factory) mount(nodes[i], factory);
    }
  });
})();
