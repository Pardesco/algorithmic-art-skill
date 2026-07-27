# Animation, Video Content & Audio-Reactive

## Perfect loops

A loop is a function of phase `t ∈ [0,1)`, never of wall-clock time.

- **Cyclic motion**: drive everything with `sin/cos(TAU * (t * k + offset))` where `k` is an integer — any integer multiple of the loop closes perfectly.
- **Looping noise**: sample noise on a circle instead of a line: `noise(cx + R*cos(TAU*t), cy + R*sin(TAU*t))`. `R` controls how much the field evolves per loop.
- **Progressive sims can't loop** (state only accumulates). Either present them as one-way "growth" clips, or crossfade the last second into the first.
- Loop length: 4–12s at 30 or 60fps. Short-form platforms re-loop the file; a seamless 6s loop reads as infinite.

## Frame capture (autonomous CLI pipeline)

The template exposes a capture contract:

```js
window.__art = {
  meta,                          // {title, size, animated, progressive, duration}
  setSeed(s), setParams(obj),
  renderFrame(n, total, scale)   // deterministic; returns dataURL PNG
}
```

`scripts/capture_frames.mjs` drives it with Playwright:

```
node scripts/capture_frames.mjs piece.html out_frames --frames 360 --seed 42 --scale 2
```

Progressive sims are stepped sequentially (frame n renders sim state after n steps); stateless pieces render any frame independently. Requires `npm i playwright` (chromium). No Playwright? Fallbacks: a loop over the browser-tools screenshot, or an in-page recorder via `canvas.captureStream()` + `MediaRecorder` (webm, less controlled).

## ffmpeg recipes

**Master** (archival quality, from frames):
```
ffmpeg -framerate 60 -i out_frames/%05d.png -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -movflags +faststart master.mp4
```
`-pix_fmt yuv420p` is mandatory for compatibility; even dimensions required (keep canvas sizes even).

**Vertical reel** (1080×1920 from a square master — pad, don't crop, unless composition allows):
```
ffmpeg -i master.mp4 -vf "scale=1080:1080,pad=1080:1920:0:420:color=#0a0a12" -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart reel.mp4
```
Match pad color to the piece's ground. Platform floor ~3s; loop a short master first: `-stream_loop 3 -i master.mp4`.

**Seamless-loop check**: `ffmpeg -stream_loop 2 -i master.mp4 loop3x.mp4` and watch the seams.

**Add audio**:
```
ffmpeg -i master.mp4 -i track.wav -c:v copy -c:a aac -b:a 192k -shortest final.mp4
```

**GIF** (only when required — video beats GIF everywhere it's allowed):
```
ffmpeg -i master.mp4 -vf "fps=24,scale=640:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse=dither=bayer" out.gif
```

**Alpha channel** (overlays/compositing): render frames with transparency, then `-c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le out.mov` or VP9 webm with `-pix_fmt yuva420p`.

## Audio-reactive

**Default: the offline pipeline.** Deterministic, re-renderable, frame-accurate — analysis happens once, then frames render from data.

1. **Extract features** to JSON (Python + librosa):

```python
import librosa, json, numpy as np
y, sr = librosa.load("track.wav", sr=None, mono=True)
FPS = 60; hop = round(sr / FPS)
rms      = librosa.feature.rms(y=y, hop_length=hop)[0]
onset    = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
centroid = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=hop)[0]
S = np.abs(librosa.stft(y, hop_length=hop))
freqs = librosa.fft_frequencies(sr=sr)
band = lambda lo, hi: S[(freqs>=lo)&(freqs<hi)].mean(axis=0)
bands = [band(20,150), band(150,800), band(800,4000), band(4000,16000)]
norm = lambda a: (a/ (a.max() or 1)).tolist()
n = len(rms)
json.dump({"fps": FPS, "frames": [
  {"rms": r, "onset": o, "centroid": c, "bands": [b[i] for b in map(norm, bands)]}
  for i,(r,o,c) in enumerate(zip(norm(rms), norm(onset), norm(centroid)))
]}, open("features.json","w"))
```

2. **Drive params per frame** — load `features.json`, and in `renderFrame(n, total)` map features to *system properties*, not directly to positions. Raw features are twitchy; smooth with an attack/release envelope:

```js
env = Math.max(x, env * 0.92);          // instant attack, ~release over frames
smooth = smooth + (x - smooth) * 0.15;  // laggy follower for slow params
```

Mapping guidance: **bass band → scale/mass/pulse** (slow, weighty), **onset → discrete events** (spawns, flashes, direction changes — threshold it, don't scale by it), **centroid → hue/brightness drift**, **rms → global energy** (speed, density). Two or three mappings done well beat six done timidly.

3. **Render frames** (capture script) → **mux the same audio file** (recipe above). Sync is exact by construction: frame n covers `n/FPS` seconds, same hop the analysis used.

**Live (interactive pieces only)**: Web Audio `AnalyserNode` (`fftSize` 1024–2048, `getByteFrequencyData`), same envelope smoothing. Requires a user gesture to start audio; not deterministic, not for produced video.
