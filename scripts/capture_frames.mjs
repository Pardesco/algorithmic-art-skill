#!/usr/bin/env node
// Capture deterministic PNG frames from a viewer.html-based piece via its window.__art contract.
//
//   node capture_frames.mjs <piece.html> <outDir> [--frames 360] [--seed 42] [--scale 1]
//                           [--params '{"density":0.7}']
//
// Requires: npm i playwright  (chromium installed via `npx playwright install chromium`)
// Then encode with the ffmpeg recipes in references/animation.md, e.g.:
//   ffmpeg -framerate 60 -i out/%05d.png -c:v libx264 -crf 16 -pix_fmt yuv420p -movflags +faststart master.mp4

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [, , htmlPath, outDir, ...rest] = process.argv;
if (!htmlPath || !outDir) {
  console.error("usage: node capture_frames.mjs <piece.html> <outDir> [--frames N] [--seed S] [--scale K] [--params JSON]");
  process.exit(1);
}
const opt = (name, def) => {
  const i = rest.indexOf("--" + name);
  return i >= 0 ? rest[i + 1] : def;
};
const FRAMES = parseInt(opt("frames", "360"), 10);
const SEED = parseInt(opt("seed", "1"), 10);
const SCALE = parseFloat(opt("scale", "1"));
const PARAMS = JSON.parse(opt("params", "{}"));

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
page.on("pageerror", e => { console.error("page error:", e.message); process.exitCode = 1; });
await page.goto(pathToFileURL(resolve(htmlPath)).href);
await page.waitForFunction(() => window.__art && typeof window.__art.renderFrame === "function");

const meta = await page.evaluate(() => window.__art.meta);
console.log(`${meta.title} — ${FRAMES} frames @ seed ${SEED}, ${meta.size * SCALE}px`);
await page.evaluate(([s, prm]) => { window.__art.setSeed(s); window.__art.setParams(prm); }, [SEED, PARAMS]);

const t0 = Date.now();
for (let n = 0; n < FRAMES; n++) {
  const dataURL = await page.evaluate(
    ([n, total, scale]) => window.__art.renderFrame(n, total, scale),
    [n, FRAMES, SCALE]
  );
  await writeFile(
    resolve(outDir, String(n).padStart(5, "0") + ".png"),
    Buffer.from(dataURL.slice("data:image/png;base64,".length), "base64")
  );
  if (n % 30 === 0 || n === FRAMES - 1)
    process.stdout.write(`\r  frame ${n + 1}/${FRAMES}  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}
console.log("\ndone:", resolve(outDir));
await browser.close();
