# Technique Catalog

Purpose: breadth, not a menu. Untrained reflexes collapse to five tropes (Perlin flow field, particle trails, circle packing, recursive tree, plain Voronoi). Pick outside the reflex list, or combine two techniques from *different categories* — orthogonal combinations are where original-looking work lives.

Each entry: what it is → one implementation hint.

## Fields & flows
- **Curl noise** — divergence-free flow; particles never clump into sinks. Compute as perpendicular gradient of a noise field: `v = (∂n/∂y, -∂n/∂x)`.
- **Domain warping** — feed noise into noise: `n(p + a·n(p + b·n(p)))`. Two levels deep gives marble/agate structure. (Inigo Quilez's articles are canonical.)
- **Vector fields from math** — build fields from complex functions (`z²+c`), dipoles, or superposed rotors instead of noise; gives structure noise can't.
- **Chladni / standing waves** — `sin(n·π·x)·sin(m·π·y) ± sin(m·π·x)·sin(n·π·y)`; draw the zero-crossings (nodal lines) for cymatics plates.

## Growth & simulation
- **Reaction–diffusion (Gray–Scott)** — two-chemical grid sim; feed/kill in [0.02–0.07]/[0.05–0.07] gives spots→stripes→coral. Run 2–10k steps; render concentration with a designed ramp.
- **Differential growth** — a closed polyline where nodes repel neighbors and split when edges stretch; produces coral/brain folds. Needs spatial hashing.
- **Diffusion-limited aggregation (DLA)** — random walkers stick to a growing cluster; dendrites and lichen. Bias the walk for directional growth.
- **Space colonization** — attractor points + growing branches that consume them; the best-looking "tree/vein" algorithm, far superior to naive recursion.
- **Physarum / slime mold** — agents deposit + sense trail, turn toward it; produces transit-network filaments. Blur+decay the trail map each step.
- **Cellular automata beyond Life** — Larger-than-Life, multi-state cyclic CA, Lenia (continuous); run to interesting non-equilibrium and freeze.

## Tiling & symmetry
- **Truchet tiles** — quarter-circle or diagonal tiles randomly oriented on a grid; upgrade with multi-scale subdivision (large tiles subdivide into small).
- **Wang tiles** — edge-matched tile sets; aperiodic texture with local continuity.
- **Wallpaper groups** — take any motif, replicate under one of the 17 symmetry groups (p6m, p4g...); instant ornament. Implement as fundamental-domain transform stack.
- **Girih / Islamic star patterns** — polygons-in-contact method: lay a tiling, draw strands at fixed angles through edge midpoints.
- **Penrose / aperiodic** — rhombus substitution rules; five-fold structure that never repeats.
- **Hyperbolic tilings {p,q}** — Poincaré disk; reflect a fundamental triangle across geodesic circles. Escher-like infinite boundary detail.

## Recursion & subdivision
- **L-systems** — grammar rewriting + turtle; go beyond plants: use them for frieze patterns, space-filling curves, city grammars.
- **Recursive subdivision** — split rectangles/triangles with biased ratios (golden, √2); stop probabilistically; style per depth. Mondrian → microchip → textile depending on styling.
- **Chaos game / IFS** — iterate random affine maps; Barnsley fern generalizes to any attractor from 3–6 maps. Millions of points, additive alpha.
- **Fractal fracture** — recursively displace polygon edges (midpoint displacement) for coastlines, lightning, torn paper.

## Dynamics & attractors
- **Strange attractors** — Clifford (`x' = sin(a·y) + c·cos(a·x)`...), de Jong, Lorenz, Aizawa. Plot 10⁶–10⁷ points with additive blending; color by velocity or angle.
- **Harmonographs / Lissajous** — damped coupled sine motion; pendulum drawings. Sum 2–4 oscillators per axis with slight detuning.
- **Double pendulum / N-body trails** — chaotic trajectories as line art; run many initial conditions in a tight bundle for divergence fans.
- **Orbit traps** — inside fractal iteration (Julia/Mandelbrot), color by minimum distance to a shape; turns escape-time fractals into stained glass.

## Sampling, texture & tone
- **Poisson-disk / blue noise** — evenly-random point sets; the correct base layer for stippling, scatter, starfields (white noise clumps).
- **Dithering as art** — Floyd–Steinberg, Bayer, blue-noise threshold on gradients/photos; also drives laser-engrave halftones.
- **Halftone systems** — modulate dot size / line weight / hatch density by an underlying value map. Works for both print looks and CNC/laser depth.
- **TSP art / scribble fill** — connect stipple points into a single continuous path (greedy + 2-opt); ideal for plotters.
- **Weighted Voronoi stippling** — Lloyd relaxation weighted by image brightness; museum-grade stippling.

## Geometry operations
- **Circle packing, grown** — insert-and-grow with collision, seeded at hotspots — vary radius distribution by an underlying field (uniform random radii is the trope version).
- **Voronoi/Delaunay *operated on*** — relax, then inset cells, curve edges, or use as scaffolding for other techniques; raw cells are the trope.
- **Minimum spanning tree / relative neighborhood graphs** — connect point sets into organic networks; prune or style by edge length.
- **Hidden-line 3D → 2D** — project wireframes/terrain with occlusion culling; the classic plotter aesthetic (Joy Division ridgelines are the trivial case).
- **Superformula / supershapes** — one polar equation, enormous form range; sweep parameters along a path for shells and blooms.

## Signal & interference
- **Moiré** — overlay two near-identical line/dot systems slightly rotated or scaled; interference does the composition.
- **Wave interference** — sum circular waves from N sources; draw isolines (marching squares) or phase-color.
- **Metaballs / implicit fields** — sum of falloff functions, threshold with marching squares for blobby contours; stack multiple thresholds for topo-map looks.

## Pixels & shaders (see webgl.md)
- **fBm + ridged/turbulent variants** — `abs()` the noise for ridges; 1/f sums for terrain-like texture.
- **SDF raymarching** — signed distance fields for crisp 3D-ish forms with cheap soft shadows and glow.
- **Feedback buffers** — render previous frame slightly transformed (zoom/rotate/blur) under new drawing; video-feedback tunnels and smears.

## Combination heuristic

Pick one *structure* (tiling, subdivision, graph, symmetry group) + one *behavior* (growth, flow, interference, dithering) + one *rendering treatment* (halftone, additive glow, isolines, single-path line art). Examples: physarum **on** a Penrose tiling rendered as engrave-halftone; Chladni nodal lines **fed into** weighted stippling **connected as** one TSP path; reaction–diffusion **masked by** a wallpaper group.
