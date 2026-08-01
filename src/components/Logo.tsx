import Image from "next/image";
import Link from "next/link";

import type { SiteSettings } from "@/lib/types";

import { PeakMark } from "./PeakMark";

/**
 * Header lockup. Prefers an uploaded logo file; otherwise draws the vector
 * mark with the wordmark set in the display face.
 */
export function Logo({
  settings,
  tone = "ink",
  className = "",
}: {
  settings: SiteSettings;
  tone?: "ink" | "paper";
  className?: string;
}) {
  const uploaded = settings.logo_media;

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-3 ${className}`}
      aria-label={`${settings.brand_name} — home`}
    >
      {uploaded?.public_url ? (
        <Image
          src={uploaded.public_url}
          alt={settings.legal_name}
          width={uploaded.width ?? 320}
          height={uploaded.height ?? 120}
          className="h-11 w-auto md:h-12"
          priority
        />
      ) : (
        <>
          <PeakMark
            className={`h-7 w-auto shrink-0 md:h-8 ${
              tone === "paper" ? "text-mist" : "text-green"
            }`}
          />
          <span className="leading-none">
            <span
              className={`block font-display text-[1.0625rem] tracking-tight md:text-[1.1875rem] ${
                tone === "paper" ? "text-paper" : "text-burgundy"
              }`}
            >
              Misty Meadows
            </span>
            <span
              className={`mt-0.5 block text-[0.5rem] font-medium uppercase tracking-[0.28em] ${
                tone === "paper" ? "text-mist" : "text-stone"
              }`}
            >
              Resorts &amp; Hotels
            </span>
          </span>
        </>
      )}
    </Link>
  );
}
