# algorithmic-art — a Claude skill for generative art

A [Claude Agent Skill](https://docs.claude.com/en/docs/agents-and-tools/agent-skills) for making algorithmic art that looks intentional, runs deterministically, and exports to real media — screen, print, pen plotter, laser cutter, and video.

Built as an alternative to Anthropic's official `algorithmic-art` skill, with different priorities:

| | Official skill | This skill |
|---|---|---|
| Process | Write a 4–6 paragraph "philosophy" manifesto first | 3-sentence design intent, then build |
| Feedback | None — ship blind | **Mandatory render → critique → revise loop** |
| Variety | Whatever the model defaults to | Anti-default rule + a technique catalog across 10 categories |
| Stack | p5.js from CDN (breaks under strict CSP) | Zero-dependency vanilla canvas engine, works offline |
| Branding | Anthropic fonts/colors mandated | Neutral dark chrome, yours to restyle |
| Media | Screen PNG only | Print-res PNG, SVG for plotter/laser/CNC, video via ffmpeg, audio-reactive, Blender escalation |

## Install

**Claude Code** — clone into your personal skills directory:

```bash
git clone https://github.com/Pardesco/algorithmic-art-skill ~/.claude/skills/algorithmic-art
```

(Windows: `%USERPROFILE%\.claude\skills\algorithmic-art`.) Or copy the folder into a project's `.claude/skills/`. Claude will invoke it automatically on generative-art requests, or explicitly via `/algorithmic-art`.

**claude.ai / API** — the folder follows the standard Agent Skills layout (`SKILL.md` + resources) and can be uploaded/attached wherever skills are supported.

## What's inside

```
SKILL.md                    workflow, invariants, critique checklist, medium picker
templates/viewer.html       self-contained viewer/engine — replace one ART object per piece:
                            seeded PRNG + noise, auto-generated param UI, seed navigation,
                            hi-res deterministic export, frame-capture hooks
scripts/capture_frames.mjs  Playwright frame dump for the video pipeline
references/techniques.md    algorithm catalog (fields, growth sims, tilings, attractors, …)
references/palettes.md      color rules, OKLab interpolation, starter palettes
references/export.md        print-res math, SVG/DXF for plotter · laser · CNC
references/animation.md     perfect loops, ffmpeg recipes, offline audio-reactive pipeline
references/webgl.md         three.js / shader guidance
references/blender.md       when + how to escalate to Blender (MCP or headless)
```

## Design principles

1. **Determinism is non-negotiable.** One seed drives everything; exports are re-renders at target resolution, never upscales.
2. **Looking is the skill.** Model-generated art improves dramatically when the model is required to view and critique its own render before delivering. That loop is the core of `SKILL.md`.
3. **Fight mode collapse.** Unguided models converge on the same five tropes. The technique catalog plus a "combine two orthogonal techniques" rule keeps output diverse.
4. **The medium is part of the artwork.** A piece bound for a laser cutter is generated as vector paths in millimeters; a reel is a phase-driven loop; a print is 7200px of re-rendered pixels.
5. **Degrade gracefully.** ffmpeg, Playwright, librosa, and Blender are optional accelerators — the core 2D pipeline needs nothing but a browser.

Open the template directly to try the engine — `templates/viewer.html` ships with a working demo piece (Clifford attractor).

## License

MIT — see [LICENSE](LICENSE).
