/**
 * Measures rendered text contrast against WCAG AA and reports failures.
 *
 * Walks every visible text-bearing element, reads its *computed* colour and
 * the first opaque background behind it, composites any alpha, and checks
 * the ratio. Catches what hand-arithmetic on a palette misses: colour-mix
 * results, inherited colours and opacity utilities.
 *
 *   node scripts/contrast.mjs /rooms
 */
import fs from "node:fs";
import path from "node:path";

import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3210";
const paths = process.argv.slice(2);
const targets = paths.length > 0 ? paths : ["/"];

const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
const executablePath = fs
  .readdirSync(root)
  .filter((d) => d.startsWith("chromium-"))
  .map((d) => path.join(root, d, "chrome-linux", "chrome"))
  .find(fs.existsSync);

const audit = () => {
  /*
    Colour parsing goes through a canvas so the browser does the conversion.
    Computed styles are not always rgb(): Tailwind v4 emits `oklab(...)` for
    opacity modifiers, and reading those three coordinates as if they were
    R, G and B produces nonsense ratios.
  */
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const parse = (value) => {
    if (!value || value === "none") return null;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = value;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return { r, g, b, a: a / 255 };
  };

  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });

  const lum = ({ r, g, b }) => {
    const f = (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };

  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };

  const backgroundOf = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const bg = parse(getComputedStyle(node).backgroundColor);
      if (bg && bg.a === 1) return bg;
      // Semi-transparent layer: composite it and keep walking up.
      if (bg && bg.a > 0) {
        const under = backgroundOf(node.parentElement);
        return over(bg, under);
      }
      node = node.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };

  const failures = [];

  for (const el of document.querySelectorAll("body *")) {
    // Only elements that render their own text.
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();
    if (!own) continue;

    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") continue;
    if (Number(style.opacity) === 0) continue;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    /*
      Visually-hidden text. `.sr-only` clips a 1x1 box and `clip-path` does
      not change the border box, so these otherwise get measured against
      whatever ground they happen to sit over — and always fail, because no
      one chose a colour for text nobody can see.
    */
    if (rect.width <= 2 || rect.height <= 2) continue;
    if (getComputedStyle(el).clipPath !== "none") continue;

    const fg = parse(style.color);
    if (!fg) continue;

    const bg = backgroundOf(el);
    const effective = fg.a < 1 ? over(fg, bg) : fg;
    const value = ratio(effective, bg);

    const size = parseFloat(style.fontSize);
    const weight = Number(style.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const required = large ? 3 : 4.5;

    if (value < required) {
      failures.push({
        text: own.slice(0, 52),
        tag: el.tagName.toLowerCase(),
        cls: el.className?.toString?.().slice(0, 48) ?? "",
        ratio: Number(value.toFixed(2)),
        required,
        size: Math.round(size),
        color: style.color,
      });
    }
  }

  return failures;
};

const browser = await chromium.launch({ executablePath });
let total = 0;

for (const target of targets) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}${target}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);

  // Reveal below-the-fold sections so their text is measured too.
  await page.evaluate(async () => {
    // Instant jumps: `scroll-behavior: smooth` would otherwise mean the page
    // never travels far enough to reveal below-the-fold text.
    document.documentElement.style.scrollBehavior = "auto";
    const step = window.innerHeight * 0.75;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(700);

  const failures = await page.evaluate(audit);
  total += failures.length;

  console.log(`\n${target} — ${failures.length === 0 ? "all text passes AA" : `${failures.length} failing`}`);
  for (const f of failures) {
    console.log(`  ${f.ratio}:1 (needs ${f.required}) ${f.size}px <${f.tag}> "${f.text}"`);
    console.log(`      color ${f.color}  class="${f.cls}"`);
  }

  await page.close();
}

await browser.close();
console.log(total === 0 ? "\nContrast: PASS" : `\nContrast: ${total} failure(s)`);
process.exit(total > 0 ? 1 : 0);
