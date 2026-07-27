# Color for Generative Work

## Rules (in priority order)

1. **Value before hue.** Decide the dark/light composition first — a piece that works in grayscale works in any palette; one that doesn't can't be saved by color. Constrain most elements to a mid-value band and spend the extremes (darkest dark, brightest light) deliberately on focal areas.
2. **Never lerp raw RGB.** Midpoints go gray and muddy. Interpolate in OKLab/OKLCH (code below) or hand-pick every stop.
3. **Limited palette, one accent.** 3–5 colors. Roughly: 60% background/field, 30% secondary structure, 10% accent. The accent works *because* it is scarce.
4. **Dark grounds for luminous work.** Additive/glow aesthetics need a near-black ground (not pure `#000` — lift it slightly and tint it toward the palette).
5. **Alpha accumulation is a palette decision.** Thousands of overlapping translucent strokes shift hue and value where they pile up — design for the *accumulated* color, and check it in the render, not the stroke color.
6. **Palette as parameter, carefully.** Exposing full color pickers invites users to break the piece. Prefer exposing palette *selection* (curated sets) or a single hue-rotation knob over raw pickers.

## OKLab interpolation (drop-in, no dependencies)

```js
function srgb2oklab([r,g,b]){const f=v=>{v/=255;return v>.04045?((v+.055)/1.055)**2.4:v/12.92};
  const[R,G,B]=[f(r),f(g),f(b)];
  const l=Math.cbrt(.4122214708*R+.5363325363*G+.0514459929*B),
        m=Math.cbrt(.2119034982*R+.6806995451*G+.1073969566*B),
        s=Math.cbrt(.0883024619*R+.2817188376*G+.6299787005*B);
  return[.2104542553*l+.793617785*m-.0040720468*s,
         1.9779984951*l-2.428592205*m+.4505937099*s,
         .0259040371*l+.7827717662*m-.808675766*s];}
function oklab2srgb([L,a,bb]){const l=(L+.3963377774*a+.2158037573*bb)**3,
        m=(L-.1055613458*a-.0638541728*bb)**3,
        s=(L-.0894841775*a-1.291485548*bb)**3;
  const g=v=>{v=v>.0031308?1.055*v**(1/2.4)-.055:12.92*v;return Math.round(255*Math.min(1,Math.max(0,v)))};
  return[g(4.0767416621*l-3.3077115913*m+.2309699292*s),
         g(-1.2684380046*l+2.6097574011*m-.3413193965*s),
         g(-.0041960863*l-.7034186147*m+1.707614701*s)];}
const hex2rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const rgb2hex=c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('');
// Perceptually even blend: t in [0,1]
function mixOklab(hexA,hexB,t){const A=srgb2oklab(hex2rgb(hexA)),B=srgb2oklab(hex2rgb(hexB));
  return rgb2hex(oklab2srgb(A.map((v,i)=>v+(B[i]-v)*t)));}
// Build an N-stop ramp through several anchors:
function ramp(anchors,n){const out=[];for(let i=0;i<n;i++){const t=i/(n-1)*(anchors.length-1),
  k=Math.min(anchors.length-2,Math.floor(t));out.push(mixOklab(anchors[k],anchors[k+1],t-k));}return out;}
```

Sample a designed ramp (`ramp(anchors, 256)`) instead of computing colors ad hoc — it keeps the piece art-directable.

## Starter palettes

Use as anchors for `ramp()`, or as discrete sets. Ground listed first.

| Name | Colors | Character |
|---|---|---|
| Ember | `#16130f` `#f4ede0` `#d97757` `#8a5a3b` | warm gallery neutral + one hot accent |
| Prism Night | `#0a0a12` `#3fe0d0` `#b44cff` `#ff2e88` | dark ground, neon additive glow |
| Ledger | `#f6f2e8` `#1c1c1a` `#b3502d` | ink on paper + rust — plotter/print classic |
| Deep Field | `#050810` `#1b3a5c` `#4a90b8` `#e8d5a3` | astronomical blues, starlight accent |
| Botanical | `#101408` `#3d5a2e` `#7fa650` `#e5e8d0` `#c9583a` | leaf greens, one berry accent |
| Duotone Slate | `#141420` `#8a93b5` `#f2f2ef` | quiet two-tone; lets form carry the piece |
| Kiln | `#1a0f0d` `#5c2018` `#c14a2a` `#f0a860` `#fdf3e0` | fire ramp done in OKLab, not RGB rainbow |

## Quick checks

- Downscale the render to ~64px: still a readable composition? (value test)
- Count distinct hues in the final image: more than ~5 → tighten.
- Is the accent under ~15% of pixels? If it dominates, it's not an accent.
- Pure `#000000` or `#ffffff` backgrounds: almost always better slightly lifted/tinted.
