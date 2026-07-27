# three.js & Shaders

## When WebGL earns its complexity

- Real-time 3D (orbiting geometry, depth, lighting)
- Additive glow/bloom aesthetics at high particle counts (GPU blending is free; 2D canvas dies at ~10⁴ glowing sprites)
- Per-pixel algorithms (domain warping, SDF raymarching, feedback) — full-screen fragment shader
- 10⁵–10⁷ elements (instancing / GPGPU)

2D canvas remains the right default for line work, print statics, and anything plotter-bound.

## Setup realities

- **CDN import maps** (`three` + `three/addons/`) are fine for local files and self-hosted pages. **Strict-CSP artifact hosts block CDNs** — there, inline the library or fall back to raw WebGL (a full-screen shader quad needs no library at all, ~60 lines).
- **Capture**: create the renderer with `preserveDrawingBuffer: true` or `canvas.toDataURL()` returns black. Then the frame-capture contract from `animation.md` works unchanged.
- **Determinism**: shaders can't call a seeded PRNG — pass the seed as a uniform and hash per-fragment:

```glsl
// PCG-ish hash — never use fract(sin(x)*43758.5453), it banding-artifacts everywhere
uint h(uint x){x^=x>>16u;x*=0x7feb352du;x^=x>>15u;x*=0x846ca68bu;x^=x>>16u;return x;}
float hash(vec2 p, float seed){
  return float(h(uint(p.x)^h(uint(p.y)^h(uint(seed)))))/4294967295.0;
}
```

- **Animation**: uniform `u_t` = loop phase in [0,1), fed by the engine — never `performance.now()` inside the shader path (breaks loops and capture).

## Patterns

**Full-screen shader quad** (no lib): one `<canvas>`, compile vert (pass-through) + frag, draw a single triangle strip; all art in the fragment shader from `uv`, `u_seed`, `u_t`, param uniforms. The highest power-to-weight setup in generative art.

**Bloom/glow (three.js)**: `EffectComposer` + `RenderPass` + `UnrealBloomPass`. Keep geometry emissive-dark overall so bloom has contrast to bite — bloom on a bright scene is smear. Tune `threshold` ~0.6–0.85, `strength` ~0.6–1.5, then stop; over-bloom is the #1 amateur tell.

**Instancing**: `InstancedMesh` + per-instance matrix/color for 10⁴–10⁶ repeated forms; update matrices from your seeded CPU-side system.

**Feedback**: two render targets ping-ponged; draw previous frame slightly transformed (zoom/rotate/fade) under new content. Decay factor 0.90–0.98 sets trail length.

**Line quality**: native WebGL lines are 1px and ugly. Use `Line2`/`LineMaterial` (three addons), instanced quads, or tube geometry for weighted 3D strokes.

## Checklist deltas for 3D

Everything in the SKILL.md critique checklist, plus:
- Silhouette test: is the form readable as a shape, or only as surface noise?
- Camera: composed like a photograph (rule of thirds, foreground/background separation), not defaulted at the origin equator.
- Motion: one clear primary motion; secondary motion at ≤⅓ its amplitude.
- Bloom restraint (see above).
