# Landing page image prompts

**Nothing on the page requires a generated image.** The hero is a live Three.js scene (`docs/hero3d.js`), and the role icons and case-study mockup are inline SVG that inherit their color from CSS. Slots 1–3 below are optional upgrades, each with a commented swap-in point in `docs/index.html` / `docs/styles.css`.

The one genuinely missing asset is **slot 4, the social share card** — link previews in WeChat, Twitter, Slack, and Feishu need a real raster file, and no amount of code can substitute. Generate that one first.

## Shared art direction

The page is a dark, high-tech surface. Every image must read as emissive light on near-black, not ink on paper:

- Style: dark sci-fi technical illustration — glowing wireframe, particle field, volumetric light. NOT a photo, NOT ink/woodcut, NOT flat vector, NOT cartoon.
- Palette: near-black background (`#0a0908`), crimson (`#b8323f`) as the primary emissive color, warm amber-gold (`#e8b06a`) as the highlight. No other hues — no blue, no cyan, no purple.
- Light: everything is self-lit. Soft bloom around bright lines and nodes, deep falloff into black at the edges so the image blends into the page background.
- Recurring motif: a woven lattice / warp-and-weft grid that dissolves into a node-and-edge network — the visual metaphor for "a craft turned into a running product."
- Composition: subject centered or slightly off-center, edges fading to pure black; generous empty space so cropping never clips anything important.
- Negative prompt (use for every image): `white background, light background, paper texture, ink illustration, woodcut, photo, photorealistic, cartoon, flat vector, watermark, text, logo, blue, cyan, purple, green, teal, rainbow, low detail, blurry, noisy, cluttered`

## 1. Hero (no image needed)

`docs/hero3d.js` renders an animated GPU lattice: a 46×46 point grid rippling on a wave, connected by faint warp/weft lines, colored crimson→amber by height, with additive blending and mouse parallax. It falls back to a static SVG when WebGL is unavailable and renders a single still frame under `prefers-reduced-motion`.

If you ever want a static image instead, generate `docs/assets/hero.png` at 1200×1200 (1:1) and follow the swap-in comment in `docs/styles.css`:

```
Dark sci-fi render of a woven lattice of glowing threads rippling like fabric
in a wave, the warp and weft dissolving into a node-and-edge network of light
points toward the horizon. Crimson (#b8323f) fading to warm amber-gold
(#e8b06a) emissive lines on a near-black background (#0a0908), soft bloom,
edges falling off into pure black, volumetric depth, no text, no logo, no
color outside crimson and amber.
```

## 2. Boundary role icons (three small icons)

- Files: `docs/assets/icon-cloud.png`, `docs/assets/icon-skill.png`, `docs/assets/icon-you.png`
- Placement: `.role-icon` inside each `.boundary-card` (currently inline SVG; swap each `<svg>` for `<img class="role-icon-img" src="assets/icon-*.png" alt="">`)
- Dimensions: 200×200px square, simple enough to read at 36×36px — keep each icon to one clear silhouette, minimal internal detail
- Prompt (cloud / LoomLoom 云端):
  ```
  Minimal single-line glowing icon of a cloud shape merging into a thread
  spool, crimson (#b8323f) emissive line on transparent background, thin
  consistent stroke, soft bloom, no fill, no text, icon style, centered,
  square composition.
  ```
- Prompt (skill / Agent Skill):
  ```
  Minimal single-line glowing icon of a weaving shuttle crossing a circuit
  trace, crimson (#b8323f) emissive line on transparent background, thin
  consistent stroke, soft bloom, no fill, no text, icon style, centered,
  square composition.
  ```
- Prompt (you / 你):
  ```
  Minimal single-line glowing icon of a lightbulb with a woven thread instead
  of a filament, crimson (#b8323f) emissive line on transparent background,
  thin consistent stroke, soft bloom, no fill, no text, icon style, centered,
  square composition.
  ```
- Negative prompt: shared list above, plus `thick strokes, filled shapes, multiple objects, background scenery`.
- Export with a transparent background (PNG) so the icons sit on the dark panel without a visible box.
- Note: the current inline SVG icons inherit `color` from CSS, so they already glow via `filter:drop-shadow`. Replacing them is optional.

## 3. Case-study mockup

- File: `docs/assets/case-mockup.png`
- Placement: `.case-visual` inside `#case` (currently an inline SVG dark-dashboard mockup; swap for an `img` tag)
- Dimensions: 1560×660px (roughly 7:3), rendered at full card width with rounded corners
- Prompt:
  ```
  Dark sci-fi render of an abstract analytics dashboard: a rising bar chart
  whose bars are made of vertical glowing threads, a bright trend line arcing
  across the peaks, faint grid lines receding into depth, framed by a minimal
  dark browser window. Crimson (#b8323f) bars and amber-gold (#e8b06a) trend
  line, emissive on a near-black background (#0a0908), soft bloom, no readable
  text, no UI icons, no color outside crimson and amber.
  ```
- Negative prompt: shared list above, plus `readable text, real screenshot, UI icons, browser logo`.
- Suggested settings: aspect ratio 7:3 (or crop a 16:9 generation), high detail, dark sci-fi lighting.

## 4. Social share card — the one image actually worth generating

- File: `docs/assets/og-cover.png`
- Placement: not on the page. It is the link preview shown when someone shares the URL in WeChat, Twitter/X, Slack, Feishu, or LinkedIn. Requires adding two meta tags (see below).
- Dimensions: exactly **1200×630px**. This is a hard requirement — every platform crops to 1.91:1, and off-ratio images get letterboxed or center-cropped badly.
- Safe area: keep everything meaningful inside the middle 1000×500px. WeChat and Slack crop the edges.
- Prompt:
  ```
  Dark sci-fi key visual, wide banner composition: a woven lattice of glowing
  threads sweeping from the lower left, its warp and weft dissolving toward the
  upper right into a constellation of light nodes connected by thin traces.
  Crimson (#b8323f) threads warming to amber-gold (#e8b06a) at the bright
  nodes, emissive on a near-black background (#0a0908), soft bloom, deep
  falloff into pure black at all four edges, cinematic depth, wide empty space
  in the left third, no text, no logo, no color outside crimson and amber.
  ```
- Negative prompt: shared list above, plus `centered subject, busy composition, square framing, border, frame`.
- Suggested settings: aspect ratio 1.91:1 (`--ar 1200:630`), high detail, cinematic lighting.
- Note: leave the left third relatively empty. If you later want the product name burned into the card, that is where it goes.

After saving the file, add these two tags inside `<head>` in `docs/index.html`, right after the existing `og:description`:

```html
<meta property="og:image" content="https://gold3bear.github.io/create-your-loom-store/assets/og-cover.png">
<meta name="twitter:card" content="summary_large_image">
```

The `og:image` URL must be absolute — relative paths are ignored by every platform. Do not add these tags before the file exists, or `check_landing_page.mjs` link validation will fail.

## After generating

1. Save files under `docs/assets/` using the exact filenames above (create the folder if it doesn't exist).
2. Swap the corresponding `<svg>...</svg>` block in `docs/index.html` for an `<img>` tag pointing at the new file (each spot has a `<!-- Swap-in point -->` comment). For the share card, add the two meta tags instead.
3. Re-run `node scripts/check_landing_page.mjs --html docs/index.html --lang zh` to confirm the page still validates (missing local files will fail the link check).
4. Commit the new images and the HTML change together.
