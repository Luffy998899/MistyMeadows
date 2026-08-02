import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import type { Testimonial } from "@/lib/types";

function Stars({ rating }: { rating: number }) {
  return (
    <p className="flex items-center justify-center gap-1 text-gold" aria-label={`${rating} out of 5`}>
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
    <section className="section on-mint" aria-labelledby="guests-title">
      <div className="shell">
        <Reveal>
          <SectionHeading
            eyebrow="In their words"
            title={
              <span id="guests-title">
                What guests said <span className="signature">afterwards</span>
              </span>
            }
          />
        </Reveal>

        <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 3).map((item, i) => (
            <Reveal
              as="figure"
              key={item.id}
              delay={i * 110}
              className="card flex flex-col p-7 text-center"
            >
              <Stars rating={item.rating} />

              {item.headline ? (
                <h3 className="mt-4 font-display text-[1.25rem] leading-snug">{item.headline}</h3>
              ) : null}

              <blockquote className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-stone">
                {item.quote}
              </blockquote>

              <figcaption className="mt-6 border-t border-paper-edge pt-5 text-sm font-medium">
                {item.author}
                {item.stay_date ? (
                  <span className="ml-2 font-normal text-stone">{item.stay_date}</span>
                ) : null}
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
