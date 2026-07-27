# Blender Escalation

Blender is the top rung: real global illumination, volumetrics, refraction/caustics, physically-based DOF and motion blur, and arbitrary-resolution stills. Reach for it when the look *requires* light transport — glass/crystal, god rays, subsurface — or when a 3D piece must print large. Do not reach for it when 2D canvas or a shader would produce the same read; the iteration loop is 10–100× slower.

## Two access modes

**1. Blender MCP** (if `mcp__blender__*` tools are connected): drive a live Blender session with `execute_blender_code`, verify with `get_viewport_screenshot` — the critique loop works the same as 2D, just slower.

- **Never block the MCP connection with a synchronous render.** Long renders freeze the socket and can kill the session. Kick renders off via `bpy.app.timers.register(...)`, or write a script and run it in a *separate* headless process.
- Keep viewport checks cheap: EEVEE or low-sample Cycles viewport screenshots for composition/critique; full-quality Cycles only for finals.

**2. Headless CLI** (works anywhere Blender is installed):

```
blender -b scene.blend -P gpu_setup.py -o //frames/frame_##### -F PNG -s 1 -e 360 -a
```

Headless Blender frequently **falls back to CPU silently**. Force the GPU in a `-P` script:

```python
import bpy
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"   # or "CUDA"/"HIP"/"METAL" per platform
prefs.get_devices()
for d in prefs.devices: d.use = (d.type != "CPU")
bpy.context.scene.cycles.device = "GPU"
```

## Keeping it algorithmic

The skill's invariants still apply — the scene should be *generated*, not hand-modeled:

- Build geometry from Python (`bpy` mesh from your algorithm's vertices/edges) or Geometry Nodes with a seed input; store the seed in the scene so re-renders reproduce.
- Same params-object discipline: one Python dict at the top of the generator script.
- A robust interchange pattern: generate geometry in your own code → export OBJ/PLY/USD → import into a *template lighting scene* → render. Decouples the algorithm from Blender versions and lets the 2D/CLI pipeline do the generative part.

## Render/finish notes

- Stills for print: set exact pixel dimensions from `export.md`'s table; Cycles + denoiser; save PNG 16-bit or EXR if grading afterward.
- Animations: render PNG/EXR frame sequences, **never** direct-to-video from Blender — then use the ffmpeg recipes in `animation.md`. Frame sequences survive crashes; videos don't.
- Version gotchas move fast (e.g., Blender 4.x renamed curve attributes like `radius` handling in Geometry Nodes). When a GN setup silently does nothing, check attribute names against the installed version's docs first.
- Match grade to the rest of the series: pull the palette from `palettes.md` into the world/emission colors rather than inventing a new look per render.
