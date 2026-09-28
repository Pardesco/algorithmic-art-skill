# algorithmic-art — an agent skill for generative art

An [Agent Skill](https://docs.claude.com/en/docs/agents-and-tools/agent-skills) for making algorithmic art that looks intentional, runs deterministically, and exports to real media: screen, print, pen plotter, laser cutter, and video. Written for any capable coding agent. It's tested with Claude Code and OpenAI Codex.

Built as an alternative to Anthropic's official `algorithmic-art` skill, with different priorities:

| | Official skill | This skill |
|---|---|---|
| Process | Write a 4–6 paragraph "philosophy" manifesto first | 3-sentence intent, then design the system |
| Feedback | None — ship blind | **Mandatory render → contact sheet → graded critique → revise loop** |
| Variety | Whatever the model defaults to | Anti-default rule, technique catalog, composition playbook |
| Stack | p5.js from CDN (breaks under strict CSP) | Zero-dependency vanilla canvas engine, works offline |
| Branding | Anthropic fonts/colors mandated | Neutral dark chrome, yours to restyle |
| Media | Screen PNG only | Print-res PNG, **SVG in mm for plotter/laser/CNC**, video via ffmpeg, audio-reactive, Blender escalation |

## Install

**Claude Code**: clone into your personal skills directory:

```bash
git clone https://github.com/Pardesco/algorithmic-art-skill ~/.claude/skills/algorithmic-art
```

**OpenAI Codex**: same folder layout, different location:

```bash
git clone https://github.com/Pardesco/algorithmic-art-skill ~/.codex/skills/algorithmic-art
```

(Windows: `%USERPROFILE%\.claude\skills\...` / `%USERPROFILE%\.codex\skills\...`. To use one copy for both, clone once and link the other path to it: `mklink /J` on Windows, `ln -s` elsewhere.) The skill triggers automatically on generative-art requests. You can also call it explicitly with `/algorithmic-art` (Claude) or `$algorithmic-art` (Codex).

**claude.ai / API / other harnesses**: the folder follows the standard skills layout (`SKILL.md` + resources). Upload or attach it wherever skills are supported.

**Optional tooling**: run `npm i` once inside the skill folder to enable the render scripts. They use Playwright, and they fall back to your installed Chrome or Edge, so a separate browser download usually isn't needed. Without it, the skill still works through headless Chrome screenshots of the viewer's `#view=sheet` mode.

## What's inside

```
SKILL.md                     workflow, how-to-look, critique protocol, invariants, medium picker
AGENTS.md                    notes for agents working on the skill itself
agents/openai.yaml           Codex skill metadata
templates/viewer.html        zero-dependency engine; replace one ART object per piece:
                             seeded PRNG + noise, OKLab ramps, grain, auto param UI, seed nav,
                             URL-hash state, any aspect ratio, hi-res PNG export, paths() → SVG
                             in mm with layer groups + path ordering, #view=sheet contact sheets,
                             window.__art automation hooks
scripts/render_stills.mjs    contact sheet + stills (+ SVG) for the critique loop; flags blank renders
scripts/capture_frames.mjs   deterministic frame dump for video
references/techniques.md     algorithm catalog, upgraded tropes, seed-robustness patterns
references/composition.md    focal hierarchy, value, edges, finishing, failure → fix table
references/palettes.md       color rules, OKLab interpolation, starter palettes
references/export.md         print-res math, SVG/DXF for plotter · laser · CNC
references/animation.md      perfect loops, ffmpeg recipes, offline audio-reactive pipeline
references/webgl.md          three.js / shader guidance + the automation contract for WebGL pieces
references/blender.md        when + how to escalate to Blender (MCP or headless)
```

## Design principles

1. **Looking is the skill.** Generated art gets much better when the model has to view a contact sheet of its own renders and grade it before delivering. That loop is the core of `SKILL.md`, and the tooling exists to make it cheap.
2. **Determinism is non-negotiable.** One seed drives everything. Exports are re-renders at the target resolution, never upscales, and a URL hash reproduces any image exactly.
3. **Fight mode collapse.** Models left alone keep producing the same five tropes. The technique catalog and the "combine two orthogonal techniques" rule keep the output varied.
4. **Composition over texture.** An interesting algorithm makes texture. Hierarchy, value structure, and deliberate edges are what make it a picture.
5. **The medium is part of the artwork.** A laser piece is generated as millimetre paths, a reel is a phase-driven loop, and a print is 7200px of re-rendered pixels.
6. **Degrade gracefully.** Playwright, ffmpeg, librosa, and Blender are optional extras. The core 2D pipeline needs nothing but a browser.

Open `templates/viewer.html` directly to try the engine. The demo piece, "Fold Basin", is a Clifford attractor that rejects degenerate orbits using a Lyapunov exponent and an occupancy test, then renders them with density tone mapping. Try `viewer.html#view=sheet&seeds=1-16` to see how it holds up across seeds.

## License

MIT — see [LICENSE](LICENSE).
