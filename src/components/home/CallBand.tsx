import Link from "next/link";

import { PeakMark } from "@/components/PeakMark";
import { Reveal } from "@/components/Reveal";
import type { SiteSettings } from "@/lib/types";

/**
 * The "call us any time" band. The reference flanks it with a pair of
 * decorated elephants; the brand equivalent is the logo's own peak range,
 * set large and faint at each end so the band is framed without borrowing
 * somebody else's iconography.
 */
export function CallBand({ settings }: { settings: SiteSettings }) {
  const phone = settings.phones[0];
  if (!phone) return null;

  return (
    <section className="on-cream section-tight relative isolate overflow-hidden">
      <PeakMark
        className="pointer-events-none absolute -left-16 bottom-0 hidden h-28 w-auto text-green/10 md:block"
      />
      <PeakMark
        className="pointer-events-none absolute -right-16 bottom-0 hidden h-28 w-auto text-green/10 md:block"
      />

      <Reveal className="shell flex flex-col items-center text-center">
        <p className="eyebrow">Reservations, 24 hours</p>

        <p className="mt-4">
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="link-underline font-display text-[clamp(1.875rem,1.3rem+2.4vw,3rem)] leading-none text-wine"
          >
            {phone}
          </a>
        </p>

        {settings.phones[1] ? (
          <p className="mt-3 text-sm text-stone">
            or{" "}
            <a
              href={`tel:${settings.phones[1].replace(/\s/g, "")}`}
              className="link-underline text-wine"
            >
              {settings.phones[1]}
            </a>
          </p>
        ) : null}

        <p className="signature mt-6 text-[1.5rem] leading-relaxed text-green-deep md:text-[1.75rem]">
          Call any time to ask us anything about the resort
        </p>

        <Link href="/contact" className="btn btn-solid mt-7">
          Book your stay
        </Link>
      </Reveal>
    </section>
  );
}
