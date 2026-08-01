/**
 * Screenshots pages at several widths and reports horizontal overflow and
 * console errors. Used to check responsive behaviour without a browser.
 *
 *   node scripts/screenshot.mjs /rooms rooms 1440,768,375
 *
 * Assumes a server is already running (see BASE_URL).
 */
import fs from "node:fs";
import path from "node:path";

import { chromium } from "playwright";

const [, , pathArg = "/", label = "page", widthsArg = "1440,768,375"] = process.argv;

const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3210";
const OUT_DIR = process.env.SHOT_DIR ?? path.join(process.cwd(), ".screenshots");
// PLAYWRIGHT_BROWSERS_PATH installs are versioned (chromium-<build>), so
// resolve the directory rather than hard-coding a build number.
function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;

  const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
  const candidate = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("chromium-"))
    .map((entry) => path.join(root, entry.name, "chrome-linux", "chrome"))
    .find((binary) => fs.existsSync(binary));

  if (!candidate) throw new Error(`No chromium build found under ${root}`);
  return candidate;
}

const EXECUTABLE = findChromium();

fs.mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ executablePath: EXECUTABLE });
let failures = 0;

for (const width of widthsArg.split(",").map(Number)) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });

  const problems = [];
  page.on("pageerror", (error) => problems.push(String(error)));
  page.on("console", (message) => {
    // Console errors for failed subresources are unhelpfully vague ("Failed
    // to load resource"), so report the response events instead.
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) {
      problems.push(message.text());
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) problems.push(`${response.status()} ${response.url()}`);
  });

  // `networkidle` never settles here: the marquee keeps a compositor-driven
  // animation running and fonts stream in, so wait on the load event and
  // then explicitly on webfonts before shooting.
  // `networkidle` never settles here: the marquee keeps a compositor-driven
  // animation running and fonts stream in, so wait on the load event and
  // then explicitly on webfonts before shooting.
  await page.goto(`${BASE_URL}${pathArg}`, { waitUntil: "load", timeout: 45_000 });
  await page.evaluate(() => document.fonts.ready);

  // Scroll-reveal sections only become visible once they intersect the
  // viewport. A full-page screenshot does not scroll, so without this pass
  // every below-the-fold section would be captured at opacity 0.
  await page.evaluate(async () => {
    // The site sets `scroll-behavior: smooth`, which makes scrollTo animate;
    // stepping faster than the animation means the page never actually
    // travels and only the topmost reveals fire. Force instant jumps.
    const previous = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";

    const step = window.innerHeight * 0.75;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    document.documentElement.style.scrollBehavior = previous;
    await new Promise((resolve) => setTimeout(resolve, 250));
  });

  await page.waitForTimeout(2000);

  const { scrollW, clientW } = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  }));

  await page.screenshot({ path: path.join(OUT_DIR, `${label}-${width}.png`), fullPage: true });

  const overflows = scrollW > clientW;
  if (overflows || problems.length) failures++;

  console.log(
    `${label} @${width}px  scroll=${scrollW} client=${clientW}` +
      (overflows ? "  <-- HORIZONTAL OVERFLOW" : "  ok"),
  );
  for (const problem of problems.slice(0, 5)) console.log(`    ! ${problem}`);

  await page.close();
}

await browser.close();
process.exit(failures > 0 ? 1 : 0);
