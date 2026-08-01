import Link from "next/link";

import type { Facility } from "@/lib/types";

/**
 * "Why book direct" as a plain numbered list with hairline rules — the
 * information is worth stating, but it does not need five drop-shadowed
 * cards to say it.
 */
export function BookingBenefits({
  benefits,
  note,
}: {
  benefits: Facility[];
  note?: string | null;
}) {
  if (benefits.length === 0) return null;

  return (
    <section className="section" aria-labelledby="direct-title">
      <div className="shell grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20">
        <div>
          <h2 id="direct-title" className="text-h2">
            Booking direct
          </h2>
          {note ? <p className="mt-5 max-w-sm text-stone">{note}</p> : null}
          <Link href="/contact" className="btn btn-solid mt-8">
            Send an enquiry
          </Link>
        </div>

        <ul className="border-t border-paper-edge">
          {benefits.map((benefit, i) => (
            <li
              key={benefit.id}
              className="grid grid-cols-[2.5rem_1fr] items-baseline gap-x-4 border-b border-paper-edge py-5 sm:grid-cols-[3.5rem_minmax(0,14rem)_1fr] sm:gap-x-8"
            >
              <span className="eyebrow">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-display text-[1.125rem] leading-snug">{benefit.name}</h3>
              <p className="col-start-2 mt-1 text-sm text-stone sm:col-start-3 sm:mt-0">
                {benefit.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
