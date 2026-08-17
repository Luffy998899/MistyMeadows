/**
 * Rate display.
 *
 * The owner enters the pre-tax tariff and the GST rate; everything shown to
 * a guest is computed here so nobody is doing the arithmetic by hand.
 *
 * Rounding: GST is computed on the base and the total rounded to the nearest
 * rupee. Rates are quoted, not invoiced, so paise are noise.
 */

export type Rate = {
  /** Headline figure, e.g. "₹4,480" or "Rates on request". */
  display: string;
  /** Supporting line, e.g. "₹4,000 + 12% GST". Null when nothing to add. */
  note: string | null;
  /** True when a real number is being shown. */
  hasPrice: boolean;
};

export function rupees(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export function grossAmount(base: number, gstPercent?: number | null): number {
  if (!gstPercent || gstPercent <= 0) return base;
  return base * (1 + gstPercent / 100);
}

/**
 * @param base       pre-tax amount, or null/0 when not published
 * @param gstPercent GST rate, or null when not configured
 * @param period     wording for the per-unit suffix, e.g. "per night"
 */
export function formatRate(
  base: number | null | undefined,
  gstPercent: number | null | undefined,
  period = "per night",
): Rate {
  if (!base) {
    return { display: "Rates on request", note: null, hasPrice: false };
  }

  // GST not configured: show the base and be explicit that tax is extra,
  // rather than implying the number is the final price.
  if (!gstPercent || gstPercent <= 0) {
    return {
      display: rupees(base),
      note: `${period} + applicable taxes`,
      hasPrice: true,
    };
  }

  const gstLabel = Number.isInteger(gstPercent)
    ? String(gstPercent)
    : gstPercent.toFixed(2).replace(/\.?0+$/, "");

  return {
    display: rupees(grossAmount(base, gstPercent)),
    note: `${period}, incl. ${gstLabel}% GST · ${rupees(base)} + tax`,
    hasPrice: true,
  };
}
