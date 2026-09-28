# Composition & Finishing

The algorithm makes texture; composition makes a picture. Most generative work fails here: the system is interesting, but the image is evenly interesting everywhere, which reads as wallpaper. These are concrete, *algorithmic* ways to build hierarchy — each one is a few lines inside `render()`.

## Build hierarchy into the system

- **Importance field.** Define one scalar field `I(x,y)` in [0,1] early — a soft blob off-centre, a band along a diagonal, a noise field thresholded into two or three regions — and let it modulate everything: density, stroke weight, contrast, step size, scale. One field driving many properties makes them agree, and agreement reads as intent.
- **Focal placement.** Put the densest or brightest region off-centre (thirds, or golden ratio ≈ 0.382/0.618). Dead-centre radial symmetry with no tension is one of the tells. If the system is naturally centred (attractors, mandalas), break it: offset the frame, crop into it, or give it a directional light/density gradient.
- **Three layers.** Ground (low contrast, large scale, quiet), structure (mid contrast, carries the composition), detail (high contrast, small, concentrated where `I` is high). Render them as separate passes with separate parameters; one pass that does everything produces uniform texture.
- **Scale contrast.** Mix at least two scales that differ by 5× or more — big forms plus fine detail. Everything at one scale is noise soup.
- **Rest areas.** Reserve 20–40% of the canvas as near-empty ground. Negative space is what makes the dense parts register. Mask the system with `I` rather than relying on chance gaps.
- **Directional flow.** Give the eye a path: a dominant diagonal, a spiral in, a gradient from sparse to dense. Random isotropic orientation everywhere has no path.

## Value first

- Squint test: downscale the render to ~64px (or view the contact sheet cell). If the thumbnail has no clear dark/light shape, the full-size image won't either — fix values before touching hue.
- Spend extremes deliberately: most of the image in a mid-value band; the darkest darks and brightest lights only at the focus.
- For dense accumulation (attractors, IFS, particle density, trails): **histogram → log → gamma**. Plot hit counts into a `Float32Array`, then `lum = (log1p(h)/log1p(max))^γ`. γ > 1 darkens mid-tones and lets the densest folds become the focus; γ < 1 opens up faint filaments. Map a *second* accumulated quantity (speed, angle, age) to hue through `env.ramp()` — normalized to the piece's own range so every seed uses the whole ramp. Optionally blend toward a light "core" colour by `lum³` for hot centres. See the demo piece.

## Edges and frame

Decide the edge treatment on purpose; don't let the canvas crop happen to you:

- **Margin**: the system lives inside a padded rectangle (≈6–10% of the short side) — gallery/print look. Fit the system's *measured* bounds (percentile box, not min/max — outliers shrink everything).
- **Bleed**: the system runs off all edges with no visible boundary — keep the density through the edges so it reads as a window onto something larger.
- **Vignette/falloff**: density or contrast decays toward the edges via `I`. Subtle; overdone vignettes look like a filter.
- **Frame-aware**: structures that respond to the boundary (grow away from it, reflect off it, align to it).

## Finishing

- **Grain**: `env.grain(ctx, 2–4)` after pixel work. It removes 8-bit banding in dark gradients and makes flat digital fills feel physical. Deterministic, so exports match.
- **Ground**: never pure `#000`/`#fff` — lift and tint toward the palette.
- **Line quality**: round caps/joins; weights in logical units so they scale on export; vary weight with `I` or depth rather than using one width everywhere.
- **Anti-aliasing for pixel plots**: splat to 2×2 with bilinear weights, or render at 2× and downsample, when single-pixel plotting looks crunchy.
- **Export check**: view a 1:1 crop of the 4× export at least once. Hairlines and dust that read at 1080 can vanish, alias, or moiré at print size.

## Failure → fix

| What you see | Likely cause | Fix |
|---|---|---|
| Uniform texture, nowhere to look | No importance field; single scale | Add `I(x,y)`; modulate density/contrast; add a second scale |
| Gray, muddy colour | RGB lerp, or too many hues accumulating | `env.ramp()` in OKLab; cut to 3–4 colours; check accumulated colour, not stroke colour |
| Blown-out white blobs | Clamped additive alpha | Accumulate floats, tone-map with log + gamma |
| Faint, barely-there image | Too few samples for the pixel count; linear tone map | More points (scale ∝ pixels), log tone map, lower gamma |
| Some seeds blank or degenerate | System has unstable regions of parameter space | Rejection test (occupancy, Lyapunov, bbox, energy) consuming the seeded rng; narrower ranges |
| Art pinned to a corner / too small | Fit to min/max with outliers | Fit to 0.5–99.5 percentile bounds |
| Banding in dark gradients | 8-bit quantisation | `env.grain()`; or dither in the tone map |
| Everything dead-centre and symmetric | Default placement | Offset focus to thirds; break symmetry with a gradient or crop |
| Looks like every other generative piece | Trope algorithm alone | Change the *system* (techniques.md combination heuristic), not the params |
| Loop "pops" at the seam | Something depends on time, not phase; or rejection depends on `t` | Drive everything from `sin/cos(2π·k·t)`; make seed-level decisions independent of `t` |
