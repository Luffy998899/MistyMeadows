/**
 * Clicks through the interactive parts of the site and asserts they work:
 * mobile menu, keyboard focus, room links, and the enquiry form's failure
 * path. Run against a live server.
 *
 *   node scripts/interactions.mjs
 */
import fs from "node:fs";
import path from "node:path";

import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3210";

const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
const executablePath = fs
  .readdirSync(root)
  .filter((d) => d.startsWith("chromium-"))
  .map((d) => path.join(root, d, "chrome-linux", "chrome"))
  .find(fs.existsSync);

const browser = await chromium.launch({ executablePath });
let failed = 0;

function check(name, condition, detail = "") {
  const status = condition ? "PASS" : "FAIL";
  if (!condition) failed++;
  console.log(`  ${status}  ${name}${detail ? ` — ${detail}` : ""}`);
}

// --- Mobile navigation -------------------------------------------------
{
  console.log("Mobile menu @375");
  const page = await browser.newPage({ viewport: { width: 375, height: 720 } });
  await page.goto(`${BASE}/`, { waitUntil: "load" });

  const panel = page.locator("#mobile-nav");
  check("panel hidden initially", await panel.isHidden());

  await page.getByRole("button", { name: /open menu/i }).click();
  await page.waitForTimeout(250);
  check("panel opens", await panel.isVisible());

  const overflowLocked = await page.evaluate(() => document.body.style.overflow === "hidden");
  check("background scroll locked", overflowLocked);

  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  check("Escape closes panel", await panel.isHidden());

  await page.getByRole("button", { name: /open menu/i }).click();
  await page.waitForTimeout(200);
  await panel.getByRole("link", { name: "Rooms & Suites" }).click();
  await page.waitForURL("**/rooms", { timeout: 10_000 });
  check("navigates from panel", page.url().endsWith("/rooms"));
  await page.waitForTimeout(300);
  check("panel closes after navigation", await page.locator("#mobile-nav").isHidden());

  await page.close();
}

// --- Keyboard focus ----------------------------------------------------
{
  console.log("Keyboard access @1440");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/`, { waitUntil: "load" });

  await page.keyboard.press("Tab");
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim());
  check("skip link is first stop", first === "Skip to content", `got "${first}"`);

  const outline = await page.evaluate(() => {
    const el = document.activeElement;
    return el ? getComputedStyle(el).outlineStyle : "none";
  });
  check("focus ring is visible", outline !== "none");

  await page.close();
}

// --- Room detail -------------------------------------------------------
{
  console.log("Room detail");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/rooms`, { waitUntil: "load" });
  await page.getByRole("link", { name: "Luxury Room", exact: true }).first().click();
  await page.waitForURL("**/rooms/luxury-room", { timeout: 10_000 });

  const h1 = await page.locator("h1").first().textContent();
  check("room page loads", h1?.includes("Luxury Room"), `h1 = "${h1}"`);

  const enquire = page.getByRole("link", { name: /enquire about this room/i });
  await enquire.click();
  await page.waitForURL("**/contact**", { timeout: 10_000 });

  const selected = await page.locator("#room_name").inputValue();
  check("room preselected on contact form", selected === "Luxury Room", `got "${selected}"`);

  await page.close();
}

// --- Enquiry form ------------------------------------------------------
{
  console.log("Enquiry form (demo mode → expects a clear error)");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/contact`, { waitUntil: "load" });

  await page.fill("#name", "Test Guest");
  await page.fill("#email", "test@example.com");
  await page.getByRole("button", { name: /send enquiry/i }).click();

  // Scope to the form: Next renders an always-present, empty route announcer
  // with role="alert", which a page-wide selector would match immediately.
  const formAlert = page.locator('form [role="alert"]');
  await formAlert.waitFor({ state: "visible", timeout: 10_000 });

  const alert = (await formAlert.textContent())?.trim();
  check("shows a human error, not a crash", Boolean(alert && alert.length > 10), alert);

  await page.close();
}

// --- Admin gate --------------------------------------------------------
{
  console.log("Admin");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const response = await page.goto(`${BASE}/admin/login`, { waitUntil: "load" });
  check("login page responds", response?.status() === 200, String(response?.status()));

  const body = await page.locator("body").textContent();
  check("explains it is not connected in demo mode", body?.includes("Not connected yet"));

  await page.close();
}

await browser.close();
console.log(failed === 0 ? "\nAll interaction checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed > 0 ? 1 : 0);
