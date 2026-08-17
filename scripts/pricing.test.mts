/**
 * Checks the GST arithmetic, since the owner enters a pre-tax tariff and the
 * site is what publishes the figure a guest sees.
 *
 *   node --experimental-strip-types scripts/pricing.test.mts
 */
import { formatRate, grossAmount } from "../src/lib/pricing.ts";

let failures = 0;

function eq(label: string, got: unknown, want: unknown): void {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) {
    failures++;
    console.log(`FAIL  ${label}\n      got  ${JSON.stringify(got)}\n      want ${JSON.stringify(want)}`);
  } else {
    console.log(`PASS  ${label}`);
  }
}

// Arithmetic
eq("4000 + 12% GST", grossAmount(4000, 12), 4480);
eq("6000 + 18% GST", grossAmount(6000, 18), 7080);
eq("GST not configured leaves the base alone", grossAmount(5000, null), 5000);
eq("zero GST leaves the base alone", grossAmount(5000, 0), 5000);

// Display
eq("headline is the tax-inclusive figure", formatRate(4000, 12).display, "₹4,480");
eq(
  "note shows the breakdown",
  formatRate(4000, 12).note,
  "per night, incl. 12% GST · ₹4,000 + tax",
);
eq("no tariff set", formatRate(null, 12).display, "Rates on request");
eq("tariff but no GST is explicit that tax is extra", formatRate(5000, null), {
  display: "₹5,000",
  note: "per night + applicable taxes",
  hasPrice: true,
});
eq("monthly period wording", formatRate(65000, 18, "per month").display, "₹76,700");
eq(
  "fractional rates keep a clean label",
  formatRate(1000, 2.5).note,
  "per night, incl. 2.5% GST · ₹1,000 + tax",
);
// Lakh grouping, not thousands grouping.
eq("Indian digit grouping", formatRate(1250000, null).display, "₹12,50,000");

console.log(failures === 0 ? "\nPricing: all correct" : `\nPricing: ${failures} failing`);
process.exit(failures > 0 ? 1 : 0);
