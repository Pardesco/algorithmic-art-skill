#!/usr/bin/env node
// Render seeds of a viewer.html-based piece to PNG (and SVG for vector pieces) for the
// critique loop: one contact sheet to judge seed robustness, plus individual stills.
//
//   node render_stills.mjs <piece.html> <outDir> [--seeds 1-9] [--scale 1] [--cell 360]
//        [--params '{"density":0.7}'] [--t 0.25] [--steps 500] [--no-each] [--svg]
//
//   --seeds    list/ranges: "7" · "1-9" · "3,17,40-44"          (default 1-9)
//   --scale    scale of the individual stills (1 = ART.width)   (default 1)
//   --cell     contact-sheet cell size in px                    (default 360)
//   --t        loop phase for animated pieces                   (default 0)
//   --steps    step count for progressive pieces                (default ART.steps or 300)
//   --no-each  contact sheet only
//   --svg      also write seed-N.svg (vector pieces) and print pen-up travel stats
//
// Prints a JSON summary: files, render ms per seed, page errors, and a blank-image check.
// The numbers are a smoke test only — you still have to LOOK at sheet.png.

import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { openPiece, arg, saveDataURL } from "./lib/browser.mjs";

const [, , htmlPath, outDir, ...rest] = process.argv;
if (!htmlPath || !outDir) {
  console.error("usage: node render_stills.mjs <piece.html> <outDir> [--seeds 1-9] [--scale 1] [--cell 360] [--params JSON] [--t T] [--steps N] [--no-each] [--svg]");
  process.exit(1);
}
const seeds = String(arg(rest, "seeds", "1-9")).split(",").flatMap(r => {
  const [a, b] = r.split("-").map(Number);
  return b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [a];
}).filter(n => n > 0);
const SCALE = parseFloat(arg(rest, "scale", "1"));
const CELL = parseInt(arg(rest, "cell", "360"), 10);
const PARAMS = JSON.parse(arg(rest, "params", "{}"));
const opts = {};
if (arg(rest, "t", null) !== null) opts.t = parseFloat(arg(rest, "t"));
if (arg(rest, "steps", null) !== null) opts.steps = parseInt(arg(rest, "steps"), 10);
const EACH = !rest.includes("--no-each"), SVG = rest.includes("--svg");

await mkdir(outDir, { recursive: true });
const { browser, page, errors } = await openPiece(htmlPath);
const meta = await page.evaluate(() => window.__art.meta);
if (Object.keys(PARAMS).length) await page.evaluate(prm => window.__art.setParams(prm), PARAMS);

// Luminance stats on a 128px downsample: catches blank / near-flat renders.
const statsOf = url => page.evaluate(async u => {
  const img = new Image(); img.src = u; await img.decode();
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d"); x.drawImage(img, 0, 0, 128, 128);
  const d = x.getImageData(0, 0, 128, 128).data; let s = 0, s2 = 0; const n = d.length / 4;
  for (let i = 0; i < d.length; i += 4) { const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; s += l; s2 += l * l; }
  const mean = s / n, std = Math.sqrt(Math.max(0, s2 / n - mean * mean));
  return { meanLum: +mean.toFixed(1), stdLum: +std.toFixed(1), flat: std < 3 };
}, url);

const summary = { piece: meta.title, size: [meta.width, meta.height], seeds: [], files: [] };
if (seeds.length > 1) {
  const url = await page.evaluate(([s, c, o]) => window.__art.contactSheet(s, c, o), [seeds, CELL, opts]);
  const f = resolve(join(outDir, "sheet.png")); await saveDataURL(f, url); summary.files.push(f);
}
for (const s of seeds) {
  const row = { seed: s };
  if (EACH || seeds.length === 1) {
    const t0 = Date.now();
    const url = await page.evaluate(([s, k, o]) => window.__art.still(s, k, o), [s, SCALE, opts]);
    row.ms = Date.now() - t0;
    Object.assign(row, await statsOf(url));
    const f = resolve(join(outDir, `seed-${s}.png`)); await saveDataURL(f, url); summary.files.push(f);
  }
  if (SVG && meta.vector) {
    const { svg, stats } = await page.evaluate(s => { window.__art.setSeed(s); return window.__art.svg(); }, s);
    const f = resolve(join(outDir, `seed-${s}.svg`)); await writeFile(f, svg); summary.files.push(f);
    row.svg = stats;
  }
  summary.seeds.push(row);
}
summary.errors = errors;
console.log(JSON.stringify(summary, null, 2));
if (summary.seeds.some(r => r.flat)) console.error("WARNING: at least one seed rendered near-flat (blank?) — check seed-N.png");
if (errors.length) process.exitCode = 1;
await browser.close();
