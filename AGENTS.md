# Agent instructions

This repository is an Agent Skill. The complete instructions are in [`SKILL.md`](SKILL.md) — read it first and follow its workflow whenever you make generative/algorithmic art, whichever model or harness you are.

When you work on the skill itself:

- `templates/viewer.html` is the engine. Keep it zero-dependency (no CDNs, no build step) and keep the `window.__art` automation contract backward compatible; the scripts and the docs depend on it.
- After any engine change, run the checks below and **look at the resulting PNGs** — don't rely on exit codes alone:
  - `node scripts/render_stills.mjs templates/viewer.html <tmp>/demo --seeds 1-16 --no-each`: every seed should be a good image (the demo is the skill's reference for seed robustness).
  - a `paths()` piece with `--svg`: check the SVG units (mm) and the layer groups.
  - a `progressive` piece through `scripts/capture_frames.mjs --frames 4 --seed N`, followed by a second seed. That second run is what catches stale-state bugs.
- Reference docs stay short and practical. They should be technique and failure→fix knowledge, not essays.
- `node_modules/` is local tooling only and is never committed.
