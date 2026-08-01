import { SectionHeading } from "./SectionHeading";
import type { Testimonial } from "@/lib/types";

function Stars({ rating }: { rating: number }) {
  return (
    <p className="flex items-center gap-1 text-green" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          aria-hidden="true"
          fill={i < rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.4l6-.8Z" />
        </svg>
      ))}
    </p>
  );
}

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section className="section bg-paper-warm" aria-labelledby="guests-title">
      <div className="shell">
        <SectionHeading
          eyebrow="In their words"
          title={
            <span id="guests-title">
              What guests said <span className="signature">afterwards</span>
            </span>
          }
        />

        <div className="mt-12 grid gap-x-10 gap-y-12 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item) => (
            <figure key={item.id} className="flex flex-col border-t border-paper-edge pt-6">
              <Stars rating={item.rating} />

              {item.headline ? (
                <h3 className="text-h3 mt-4 font-display">{item.headline}</h3>
              ) : null}

              <blockquote className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-stone">
                {item.quote}
              </blockquote>

              <figcaption className="mt-5 text-sm font-medium text-ink">
                {item.author}
                {item.stay_date ? (
                  <span className="ml-2 font-normal text-stone">{item.stay_date}</span>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
