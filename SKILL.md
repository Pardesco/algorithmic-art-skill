---
name: algorithmic-art
description: Create algorithmic/generative art as code — interactive 2D canvas pieces, SVG line art for pen plotters and laser cutters, three.js/WebGL and shader sketches, audio-reactive visuals, perfect animation loops rendered to video via ffmpeg, and high-end Blender renders. Use when the user asks for generative art, algorithmic art, creative coding, flow fields, particle systems, art loops or reels, plotter/laser/CNC art, audio-reactive visuals, or "make art with code".
---

# Algorithmic Art

Make generative art that looks intentional, runs deterministically, and exports to the medium the user actually needs (screen, print, vector cutting, video). The workflow is five steps. Steps 3 and 4 are where quality comes from — do not skip them.

## Workflow

**1. Design intent — three sentences, then stop.**
Write (in conversation, not a file): the subject/structure, the mood/palette direction, and the one algorithmic idea that drives it. Add one line naming what will make this piece NOT look like default generative art. No manifestos.

**2. Pick the medium.** Smallest tool that serves the ask:

| The ask | Medium | Reference |
|---|---|---|
| Static image or interactive piece | 2D canvas via `templates/viewer.html` | this file |
| Line art, pen plotter, laser cutter, CNC | SVG-first (real units, hairline strokes) | `references/export.md` |
| Real-time 3D, shaders, bloom/glow looks | three.js / raw WebGL | `references/webgl.md` |
| Animation loop, reel, video content | canvas frames → ffmpeg | `references/animation.md` |
| Audio-reactive | offline feature extraction → per-frame params (or Web Audio live) | `references/animation.md` |
| Volumetrics, refraction, DOF, print-res 3D | Blender (MCP if connected, else headless CLI) | `references/blender.md` |

**3. Build.** Start 2D pieces from `templates/viewer.html` — it contains the engine (seeded PRNG, noise, auto-generated parameter UI, seed navigation, hi-res export, frame-capture hook). You replace only the `ART` object. Honor the invariants below.

**4. Look at the output. Mandatory.**
Render the piece and actually view it — screenshot via headless browser, export a PNG and Read it, or use browser tools. Critique against the checklist below, revise, and look again. Minimum two critique rounds before delivering. Never ship a piece you have not seen.

**5. Deliver.** Interactive HTML (self-contained, works as a local file), plus whatever export the medium needs (print PNG, SVG, MP4). Report the seed(s) of the best variations you found.

## Invariants — every piece, every medium

- **Deterministic.** All randomness flows from one seed. Same seed + same params = pixel-identical output. Never call unseeded `Math.random()` or read the clock inside the art path.
- **One params object.** Every tunable in a single spec with min/max/step/default. The template auto-builds UI from it. Parameters are *properties of the system* (density, turbulence, contrast), not "pattern type" switches.
- **Anti-default rule.** Before choosing an algorithm, read `references/techniques.md`. The reflex tropes — Perlin flow field, particle trails, circle packing, recursive tree, plain Voronoi — are banned as the *sole* idea unless explicitly requested. Either use a technique outside that list or combine two orthogonal techniques (e.g., reaction-diffusion masked by a hyperbolic tiling; attractor trails quantized to a truchet grid).
- **Color is designed, not sampled.** Read `references/palettes.md`. Never lerp raw RGB. Establish value structure (dark/light hierarchy) before hue. Limited palettes beat rainbows.
- **Clean output.** No text, signatures, or watermarks baked into the artwork itself. UI chrome may carry a title; the canvas/export never does.
- **Performant.** Interactive pieces hold 60fps or use `noLoop`-style static rendering. Cap element counts; prefer O(n) passes and spatial hashing over naive O(n²).

## Critique checklist (step 4)

Grade the rendered image honestly against each:

- **Value structure** — squint (or downscale to 64px mentally): is there a clear dark/light composition, or uniform mush?
- **Focal hierarchy** — does the eye land somewhere, then travel? Or is interest evenly smeared?
- **Density variation** — are there rest areas AND dense areas, or is it wall-to-wall noise soup / mostly empty?
- **Edge behavior** — does the piece end deliberately (vignette, bleed, margin, frame-aware composition) or just get cropped?
- **Color discipline** — limited palette, harmonious neighbors, one accent doing the work? Or random hues?
- **The tell** — does it look like default AI generative art (uniform Perlin wisps, evenly spaced particles, centered radial symmetry with no tension)? If yes, change the algorithm, not just the params.
- **Seed robustness** — check 3+ seeds. A good system produces *different good* images, not one good seed and garbage siblings.

Fix the worst failure first, re-render, re-grade.

## Escalation notes

- **Blender**: reach for it only when 2D/WebGL genuinely can't produce the look (true volumetrics, caustics/refraction, physically-based DOF, huge print resolution with 3D geometry). Details and headless gotchas: `references/blender.md`.
- **Video/content**: the template exposes `window.__art.renderFrame(n, total)`. Use `scripts/capture_frames.mjs` (Playwright) to dump PNG frames, then the ffmpeg recipes in `references/animation.md` for masters, reels, loops, and GIFs — fully autonomous from the CLI.
- **Audio-reactive**: prefer the offline pipeline (extract features → JSON → deterministic per-frame render → mux audio). Live Web Audio is for interactive pieces only. Both in `references/animation.md`.
- **Tool availability**: Blender MCP, ffmpeg, Playwright, and Python/librosa are optional accelerators. If one is missing, say so and deliver the best result the available rungs support — the 2D template requires nothing but a browser.

## Files

- `templates/viewer.html` — self-contained viewer/engine. Dark chrome, zero dependencies, no CDNs (works offline and under strict CSP). Replace only the `ART` object.
- `scripts/capture_frames.mjs` — Playwright frame capture for video pipelines.
- `references/techniques.md` — breadth catalog of algorithms (the anti-default list).
- `references/palettes.md` — color rules, OKLab interpolation, starter palettes.
- `references/export.md` — print-resolution PNG, SVG for plotter/laser/CNC, DXF notes.
- `references/animation.md` — perfect loops, frame capture, ffmpeg recipes, audio-reactive.
- `references/webgl.md` — three.js and shader guidance.
- `references/blender.md` — when and how to escalate to Blender.
