---
name: algorithmic-art
description: Create algorithmic/generative art as code — interactive 2D canvas pieces, SVG line art for pen plotters and laser cutters, three.js/WebGL and shader sketches, audio-reactive visuals, perfect animation loops rendered to video via ffmpeg, and high-end Blender renders. Use when the user asks for generative art, algorithmic art, creative coding, flow fields, particle systems, strange attractors, art loops or reels, plotter/laser/CNC art, audio-reactive visuals, or "make art with code".
---

# Algorithmic Art

Make generative art that looks intentional, runs deterministically, and exports to the medium the user actually needs (screen, print, vector cutting, video).

The core idea: **a model writing art code blind produces default-looking art.** Quality comes from two things this skill enforces — choosing a non-default system on purpose, and *looking at the render* and revising until it holds up across seeds. Everything else is plumbing that makes those two cheap.

These instructions work for any capable coding agent (Claude, GPT/Codex, others). Where a step needs a capability — viewing an image, running a browser — use whatever your environment provides; concrete fallbacks are listed.

## Workflow

**1. Intent — three sentences, then stop.**
In the conversation (not a file): the structure/subject, the mood and value/palette direction, and the one algorithmic idea that drives it. Add one line naming what will keep it from looking like default generative art. No manifestos.

**2. Pick the medium.** Smallest tool that serves the ask:

| The ask | Medium | Reference |
|---|---|---|
| Static image or interactive piece | 2D canvas: `templates/viewer.html`, `render()` | this file |
| Line art, pen plotter, laser, CNC | same template, `paths()` → optimized SVG in mm | `references/export.md` |
| Real-time 3D, shaders, bloom/glow | three.js / raw WebGL | `references/webgl.md` |
| Loop, reel, video | template → `scripts/capture_frames.mjs` → ffmpeg | `references/animation.md` |
| Audio-reactive | offline features → per-frame params (live Web Audio only if interactive) | `references/animation.md` |
| Volumetrics, refraction, DOF, print-res 3D | Blender (MCP if connected, else headless CLI) | `references/blender.md` |
| Python raster at print size, 1M+ particles, simulations | GPU Python: CuPy / NVIDIA Warp / PyTorch, CPU fallback | `references/gpu.md` |

Canvas sizes: `width`/`height` in the ART object — square 1080 for feeds, 1080×1920 for reels (native, don't pad), print aspect ratios per `export.md`.

**3. Design the system.** Read `references/techniques.md` and pick one *structure* + one *behavior* + one *rendering treatment*, from different categories. Then read `references/composition.md` — it lists the specific moves that create focal hierarchy, value structure, and deliberate edges, which is what separates a finished piece from a demo. When the idea is open-ended, sketch 2–3 genuinely different system concepts at low resolution, contact-sheet them, and commit to the strongest; don't polish the first idea by default.

**4. Build.** Copy `templates/viewer.html` next to the user's work and replace only the `ART` object. The engine gives you: seeded `rng`/`noise`, OKLab `env.ramp()`, `env.grain()`, auto-generated parameter UI, seed navigation, URL state, hi-res PNG export, SVG export (vector pieces), and automation hooks. Its header comment is the full contract — read it before writing the ART object. Honor the invariants below.

**5. Look. Mandatory — this is where quality comes from.** Render a contact sheet of ≥9 seeds, *view the image*, and critique it (protocol below). Revise the **system** (not just parameters), re-render, look again. Minimum two rounds; stop when every checklist item passes at "good" or after ~5 rounds with the best version and a note on what's still weak. Never deliver a piece you have not seen.

**6. Deliver.** Absolute paths to: the interactive HTML (self-contained, opens as a local file), the exports the medium needs (print PNG, SVG, MP4), and the contact sheet. Name the 2–3 best seeds, with a URL hash that reproduces each (`piece.html#seed=42&fold=0.3`).

## How to look (pick the first that works)

1. **Script (best):** `node <skill>/scripts/render_stills.mjs piece.html out/ --seeds 1-9` writes `out/sheet.png` + per-seed PNGs and prints render times, page errors, and a blank-render warning. Needs Playwright once: `npm i` in the skill folder (it falls back to the system Chrome/Edge, so a browser download is usually unnecessary). Vector pieces: add `--svg`.
2. **Zero install — headless Chrome/Edge:**
   `chrome --headless=new --hide-scrollbars --window-size=1200,1200 --virtual-time-budget=20000 --screenshot=sheet.png "file:///ABS/PATH/piece.html#view=sheet&seeds=1-9&cell=380"`
   (Windows: `"C:\Program Files\Google\Chrome\Application\chrome.exe"` or `msedge.exe`; macOS: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`.) `#view=clean` gives the bare canvas for a single seed.
3. **Browser tools** (MCP/computer-use): open the same `#view=sheet` URL and screenshot.

Then open the PNG with your image-viewing capability and actually inspect it. The script's numbers are a smoke test (errors, blank frames, speed), never a substitute for looking.

## Critique protocol

For each round, write a short graded pass — one line per item, **good / weak / fail**, citing specific seeds:

- **Value structure** — at thumbnail size, is there a clear dark/light composition, or uniform mush?
- **Focal hierarchy** — does the eye land somewhere and then travel, or is interest smeared evenly?
- **Density variation** — rest areas *and* dense areas, or wall-to-wall texture / mostly empty?
- **Edges** — does the piece end deliberately (margin, bleed, frame-aware composition) or just get cropped?
- **Color discipline** — limited palette, one accent doing real work, no muddy midpoints?
- **The tell** — does it read as default generative art (uniform Perlin wisps, evenly spaced particles, dead-centered radial symmetry)? If so, change the algorithm, not the parameters.
- **Seed robustness** — how many of the 9 seeds are genuinely good? Target ≥7. Failures usually mean the system needs a rejection test or a better-behaved parameter range, not a lucky seed (the demo piece shows this pattern: it rejects degenerate attractor orbits by Lyapunov exponent and occupancy).
- **Craft** — aliasing, banding in dark gradients (use `env.grain`), clipped highlights, hairlines that vanish at export scale.

Then: name the single worst failure, state the one change that addresses it, make it, re-render, and compare against the previous sheet. If a change made things worse, revert it. Don't claim improvement you can't point to in the image.

## Invariants — every piece, every medium

- **Deterministic.** All randomness flows from the seed via `rng`/`noise`. Same seed + params = identical output — that is what makes hi-res export, video capture, and "send me seed 42" work. Never call `Math.random()` or read the clock in the art path.
- **One params object.** Every tunable in one spec with min/max/step/default. Parameters are *properties of the system* (density, turbulence, contrast), not "pattern type" switches — switches fragment one piece into several mediocre ones.
- **Anti-default rule.** The reflex tropes — Perlin flow field, particle trails, circle packing, recursive tree, plain Voronoi — are not allowed as the *sole* idea, because every unguided model converges on them and the results are interchangeable. Use a technique outside that list or combine two orthogonal ones. If the user explicitly asks for a trope, do it, and make it excellent (see `techniques.md` for the upgraded versions).
- **Color is designed.** Establish value structure before hue. Never lerp raw RGB (midpoints go gray) — use `env.ramp()` (OKLab). Limited palettes beat rainbows. Details: `references/palettes.md`.
- **Accumulate, then tone-map.** For anything built from many overlapping marks (attractors, IFS, particle density), plot into a float buffer and tone-map it (log density + gamma), rather than clamping additive alpha on the canvas. The demo piece is the reference implementation.
- **Clean output.** No text, signatures, or watermarks in the artwork. Titles live in the UI chrome only.
- **Performant.** Static pieces should render in ≲1.5s at 1× so seed browsing stays interactive — otherwise make them `progressive`. Animated pieces must hold frame rate in preview. Cap element counts; use spatial hashing over naive O(n²).
- **GPU first for heavy work.** Per-pixel or per-particle work at scale belongs on the GPU when the machine has one: shaders in the browser, CuPy / Warp / PyTorch for offline Python (`references/gpu.md`). The CPU path is the fallback, not the default.

## Escalation notes

- **Vector/fabrication**: define `paths()` instead of (or alongside) `render()`; the engine previews the paths and exports an SVG in real millimetres (`ART.mm`) with cut/engrave layers and greedy path ordering. Plotter/laser rules in `references/export.md`.
- **Video**: `node scripts/capture_frames.mjs piece.html frames/ --frames 480 --seed 42` then the ffmpeg recipes in `references/animation.md`. Loops are functions of phase `t`, never time.
- **Blender**: only when 2D/WebGL genuinely can't produce the look (true volumetrics, caustics, physically-based DOF). `references/blender.md`.
- **Missing tools**: Playwright, ffmpeg, librosa, Blender, and a CUDA GPU are optional. If one is missing, say so and deliver the best result the available rungs support — the 2D template needs nothing but a browser.

## Files

- `templates/viewer.html` — engine + demo ("Fold Basin", Clifford attractor with orbit rejection and density tone-mapping). Zero dependencies, works offline and under strict CSP. Replace only the `ART` object.
- `scripts/render_stills.mjs` — contact sheet + stills (+ SVG) for the critique loop.
- `scripts/capture_frames.mjs` — deterministic frame dump for video.
- `references/techniques.md` — algorithm catalog (the anti-default list) and upgraded versions of the tropes.
- `references/composition.md` — focal hierarchy, value, density, edges, finishing, and a failure→fix table.
- `references/palettes.md` — color rules, OKLab, starter palettes.
- `references/export.md` — print resolution, SVG for plotter/laser/CNC.
- `references/animation.md` — loops, capture, ffmpeg recipes, audio-reactive.
- `references/webgl.md` — three.js and shader guidance.
- `references/blender.md` — Blender escalation.
- `references/gpu.md` — GPU Python (CuPy, Warp, PyTorch): when it pays, backend switch, port pitfalls, verification.
