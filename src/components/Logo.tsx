import Image from "next/image";
import Link from "next/link";

import type { SiteSettings } from "@/lib/types";

import { PeakMark } from "./PeakMark";

/**
 * The brand lockup, drawn to match the company logo: the three nested-chevron
 * peaks in forest green, "Misty Meadows" beneath them in the display serif,
 * and the legal line under that — both set in the wine of the wordmark.
 *
 * Stacked is the primary orientation, because the header centres its logo
 * with the navigation split either side of it (the reference's arrangement,
 * and the one the supplied logo is drawn for). `inline` is the compact
 * variant for the mobile bar, where a stacked lockup would double the header
 * height.
 *
 * An uploaded logo in Settings replaces all of this, so the owner can swap in
 * an official file without touching code.
 */
export function Logo({
  settings,
  orientation = "stacked",
  tone = "brand",
  className = "",
}: {
  settings: SiteSettings;
  orientation?: "stacked" | "inline";
  /** `brand` on light grounds, `paper` on the green footer and dark panels. */
  tone?: "brand" | "paper";
  className?: string;
}) {
  const uploaded = settings.logo_media;
  const peaks = tone === "paper" ? "text-linen" : "text-green";
  const word = tone === "paper" ? "text-paper" : "text-wine";
  const legal = tone === "paper" ? "text-linen/80" : "text-wine/70";

  if (uploaded?.public_url) {
    return (
      <Link
        href="/"
        className={`inline-flex ${className}`}
        aria-label={`${settings.brand_name} — home`}
      >
        <Image
          src={uploaded.public_url}
          alt={settings.legal_name}
          width={uploaded.width ?? 320}
          height={uploaded.height ?? 120}
          className={orientation === "stacked" ? "h-14 w-auto md:h-16" : "h-10 w-auto"}
          priority
        />
      </Link>
    );
  }

  if (orientation === "inline") {
    return (
      <Link
        href="/"
        className={`inline-flex items-center gap-2.5 ${className}`}
        aria-label={`${settings.brand_name} — home`}
      >
        <PeakMark className={`h-6 w-auto shrink-0 ${peaks}`} />
        <span className={`font-display text-[1.25rem] leading-none ${word}`}>Misty Meadows</span>
      </Link>
    );
  }

  return (
    <Link
      href="/"
      className={`inline-flex flex-col items-center ${className}`}
      aria-label={`${settings.brand_name} — home`}
    >
      <PeakMark className={`h-6 w-auto md:h-7 ${peaks}`} />
      <span
        className={`mt-1.5 font-display text-[1.375rem] leading-none md:text-[1.625rem] ${word}`}
      >
        Misty Meadows
      </span>
      <span
        className={`mt-1 text-[0.4375rem] font-medium uppercase leading-none tracking-[0.24em] md:text-[0.5rem] ${legal}`}
      >
        Resorts &amp; Hotels Pvt. Ltd.
      </span>
    </Link>
  );
}
