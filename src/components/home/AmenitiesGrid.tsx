import Link from "next/link";

import { Icon } from "@/components/Icon";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import type { Facility } from "@/lib/types";

/**
 * The reference's three-column amenities grid, on the cream ground: an icon,
 * a title and a line of description per cell, with a single button beneath.
 *
 * The rows carried here are the "book direct" benefits, which is the one set
 * of claims worth restating right before the call band — and it means the
 * facilities themselves are not listed twice on one page.
 */
export function AmenitiesGrid({
  benefits,
  note,
}: {
  benefits: Facility[];
  note?: string | null;
}) {
  if (benefits.length === 0) return null;

  return (
    <section className="on-cream section" aria-labelledby="amenities-title">
      <div className="shell">
        <Reveal>
          <SectionHeading
            eyebrow="We deliver best"
            title={<span id="amenities-title">Booking direct</span>}
            lead={note ?? undefined}
          />
        </Reveal>

        <ul className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit, i) => (
            <Reveal
              as="li"
              key={benefit.id}
              delay={i * 80}
              className="flex items-start gap-4 border-t border-gold/25 pt-6"
            >
              <Icon name={benefit.icon} className="mt-0.5 h-7 w-7 shrink-0 text-green" />
              <div>
                <h3 className="font-display text-[1.1875rem] leading-snug text-ink">
                  {benefit.name}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone">
                  {benefit.description}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>

        <div className="mt-12 flex justify-center">
          <Link href="/facilities" className="btn btn-solid">
            All facilities &amp; amenities
          </Link>
        </div>
      </div>
    </section>
  );
}
