import { NewsletterForm } from "@/components/NewsletterForm";
import { PeakGlyph } from "@/components/PeakMark";
import { Reveal } from "@/components/Reveal";

/**
 * The newsletter strip that closes the reference's home page, above the
 * footer. Kept short: a script line, one sentence of what actually arrives,
 * and the field.
 */
export function NewsletterBand() {
  return (
    <section className="section-tight border-t border-paper-edge" aria-labelledby="newsletter-title">
      <Reveal className="shell flex flex-col items-center text-center">
        <div className="ornament mb-4 text-gold">
          <PeakGlyph className="h-2.5 w-auto shrink-0" />
        </div>

        <h2 id="newsletter-title" className="signature text-[2rem] leading-tight text-wine md:text-[2.5rem]">
          Subscribe to our newsletter
        </h2>

        <p className="mt-4 max-w-lg text-sm text-stone">
          Seasonal offers, the odd note about what the valley looks like this
          month, and nothing else. A few times a year.
        </p>

        <div className="mt-7 w-full max-w-lg text-left">
          <NewsletterForm tone="light" />
        </div>
      </Reveal>
    </section>
  );
}
