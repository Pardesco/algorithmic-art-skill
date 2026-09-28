// Shared Playwright loader for the skill's scripts.
//
// Resolution order for the `playwright` package:
//   1. next to the skill (run `npm i` once in the skill folder — see package.json)
//   2. the current working directory's node_modules
// Browser: bundled Chromium if installed, else the system Chrome, else Edge — so
// `npx playwright install chromium` is optional on most desktops.

import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { writeFile } from "node:fs/promises";

async function loadPlaywright() {
  try { return await import("playwright"); } catch {}
  for (const name of ["playwright", "playwright-core"]) {
    try {
      const req = createRequire(pathToFileURL(resolve(process.cwd(), "noop.js")).href);
      return await import(pathToFileURL(req.resolve(name)).href);
    } catch {}
  }
  console.error(
    "Playwright not found. Install it once, either in the skill folder or your project:\n" +
    "  npm i playwright            (then optionally: npx playwright install chromium)\n" +
    "Zero-install fallback: headless Chrome screenshot of <piece>.html#view=sheet (see SKILL.md).");
  process.exit(2);
}

export async function openPiece(htmlPath, { viewport = { width: 1400, height: 1000 } } = {}) {
  const { chromium } = await loadPlaywright();
  let browser, lastErr;
  for (const opts of [{}, { channel: "chrome" }, { channel: "msedge" }]) {
    try { browser = await chromium.launch(opts); break; } catch (e) { lastErr = e; }
  }
  if (!browser) { console.error("Could not launch Chromium, Chrome, or Edge:", lastErr?.message); process.exit(2); }
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(pathToFileURL(resolve(htmlPath)).href);
  try {
    await page.waitForFunction(() => window.__art && typeof window.__art.renderFrame === "function", null, { timeout: 60000 });
  } catch {
    console.error("window.__art never appeared — the piece threw during boot:\n  " + (errors.join("\n  ") || "(no error captured)"));
    await browser.close(); process.exit(1);
  }
  return { browser, page, errors };
}

export function arg(rest, name, def) {
  const i = rest.indexOf("--" + name);
  if (i < 0) return def;
  const v = rest[i + 1];
  return v === undefined || v.startsWith("--") ? true : v;
}

export async function saveDataURL(file, dataURL) {
  await writeFile(file, Buffer.from(dataURL.slice(dataURL.indexOf(",") + 1), "base64"));
}
