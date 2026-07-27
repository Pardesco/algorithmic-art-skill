# Export: Print, Plotter, Laser, CNC

The interactive HTML is the *viewer*; the sellable/cuttable object is an export. Because every piece is deterministic, exports are **re-renders at target resolution**, never upscales.

## Print-resolution PNG

Re-run the full pipeline on a scaled canvas (the template's export button does this via `ctx.scale`):

| Print size @300dpi | Pixels |
|---|---|
| 12″ × 12″ | 3600 × 3600 |
| 18″ × 24″ | 5400 × 7200 |
| 24″ × 24″ | 7200 × 7200 |
| 36″ × 36″ | 10800 × 10800 |

- Keep all coordinates in *logical* units so `ctx.scale(k,k)` is the only change. Line widths, blur radii, and point sizes in logical units scale correctly for free.
- Canvas dimension limits: browsers cap around 16k–32k per side and total area varies by GPU/OS. Above ~12k, render in tiles (translate the context per tile, stitch with ffmpeg/ImageMagick or a Node canvas script).
- Progressive sims (accumulated state) must re-run the whole sim at scale — expensive but correct. Budget for it; never bitmap-upscale.
- For pieces headed to print-on-demand, check the accumulated-alpha look at full res — hairline strokes that read at 1080px can vanish or moiré at 7200px.

## SVG for plotter / laser / CNC

Vector output is a *generation mode*, not a conversion: the algorithm should emit paths, not pixels. Design line-art pieces as path lists from the start (single-line strokes, no fills), then serialize.

**Document setup — real units:**

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="300mm" height="300mm" viewBox="0 0 300 300">
```

`viewBox` in mm so 1 user unit = 1mm. All machine software then imports at true scale.

**Laser conventions:**
- **Cut lines**: stroke `#ff0000`, hairline width (`0.1` or `0.001in` — LightBurn/RDWorks treat these as vector cut).
- **Engrave lines** (vector scan): stroke `#0000ff`.
- **Raster engrave regions**: black fills, or supply a separate grayscale PNG at 254–318 DPI.
- Put cut and engrave on separate `<g id="cut">` / `<g id="engrave">` groups so layers map cleanly.
- **Kerf**: ~0.1–0.2mm removed per cut for CO₂ on wood/acrylic. Matters for interlocking parts only; art pieces usually ignore it.
- Some laser software prefers **DXF R12** — export polylines only (no splines: sample curves to short segments first).

**Plotter/quality rules (also improve laser vector time):**
- **Join paths**: merge segments sharing endpoints into long polylines — pen lifts and laser head hops dominate runtime. Greedy nearest-endpoint ordering is enough; 2-opt if you care.
- **Deduplicate** overlapping segments (double-burns scorch, double-draws blob).
- **Cull hidden lines** for 3D projections — occlusion-test each segment against nearer geometry.
- **Simplify**: Ramer–Douglas–Peucker at ~0.05–0.1mm tolerance; thousands of micro-segments make machines vibrate and files bloat.
- Respect a **margin** (≥5mm) and note the machine bed limit in the piece's params (e.g., max 300×300mm).

**Serializer sketch:**

```js
function toSVG(paths, wMM, hMM){ // paths: [{pts:[[x,y]...], kind:'cut'|'engrave'}]
  const d=p=>'M'+p.pts.map(([x,y])=>`${x.toFixed(2)},${y.toFixed(2)}`).join('L');
  const g=k=>paths.filter(p=>p.kind===k).map(p=>`<path d="${d(p)}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${wMM}mm" height="${hMM}mm" viewBox="0 0 ${wMM} ${hMM}">`+
    `<g id="engrave" fill="none" stroke="#0000ff" stroke-width="0.1">${g('engrave')}</g>`+
    `<g id="cut" fill="none" stroke="#ff0000" stroke-width="0.1">${g('cut')}</g></svg>`;
}
```

## Choosing pixel vs vector

- Glow, additive blending, texture, alpha accumulation → **pixel** (print PNG).
- Anything a machine will trace, or that must scale infinitely → **vector**, generated as paths.
- Hybrid products (engraved halftone + cut outline) → one SVG with both layers, halftone as line-based hatching or dot grid — *generated*, not image-traced.
