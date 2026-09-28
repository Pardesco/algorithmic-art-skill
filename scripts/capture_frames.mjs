#!/usr/bin/env node
// Capture deterministic PNG frames from a viewer.html-based piece via its window.__art contract.
//
//   node capture_frames.mjs <piece.html> <outDir> [--frames 360] [--seed 42] [--scale 1]
//                           [--params '{"density":0.7}']
//
// Stateless pieces render frame n at loop phase n/frames (so frames = duration × fps closes the
// loop exactly). Progressive pieces step sequentially: frame n = sim state after n+1 steps.
// Requires Playwright (see scripts/lib/browser.mjs). Then encode with references/animation.md, e.g.
//   ffmpeg -framerate 60 -i out/%05d.png -c:v libx264 -crf 16 -pix_fmt yuv420p -movflags +faststart master.mp4

import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { openPiece, arg, saveDataURL } from "./lib/browser.mjs";

const [, , htmlPath, outDir, ...rest] = process.argv;
if (!htmlPath || !outDir) {
  console.error("usage: node capture_frames.mjs <piece.html> <outDir> [--frames N] [--seed S] [--scale K] [--params JSON]");
  process.exit(1);
}
const FRAMES = parseInt(arg(rest, "frames", "360"), 10);
const SEED = parseInt(arg(rest, "seed", "1"), 10);
const SCALE = parseFloat(arg(rest, "scale", "1"));
const PARAMS = JSON.parse(arg(rest, "params", "{}"));

await mkdir(outDir, { recursive: true });
const { browser, page, errors } = await openPiece(htmlPath);
const meta = await page.evaluate(() => window.__art.meta);
const w = Math.round(meta.width * SCALE), h = Math.round(meta.height * SCALE);
if (w % 2 || h % 2) console.warn(`WARNING: ${w}×${h} has an odd side — libx264/yuv420p will refuse it. Pick an even size or scale.`);
console.log(`${meta.title} — ${FRAMES} frames @ seed ${SEED}, ${w}×${h}px`);
await page.evaluate(([s, prm]) => { window.__art.setSeed(s); window.__art.setParams(prm); }, [SEED, PARAMS]);

const t0 = Date.now();
for (let n = 0; n < FRAMES; n++) {
  const dataURL = await page.evaluate(([n, total, scale]) => window.__art.renderFrame(n, total, scale), [n, FRAMES, SCALE]);
  await saveDataURL(resolve(outDir, String(n).padStart(5, "0") + ".png"), dataURL);
  if (errors.length) { console.error("\npage error:", errors.join("\n")); process.exitCode = 1; break; }
  if (n % 30 === 0 || n === FRAMES - 1)
    process.stdout.write(`\r  frame ${n + 1}/${FRAMES}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
console.log("\ndone:", resolve(outDir));
await browser.close();
