import Link from "next/link";

import { MediaFrame } from "@/components/MediaFrame";
import { PeakGlyph } from "@/components/PeakMark";
import { Reveal } from "@/components/Reveal";
import type { Media } from "@/lib/types";

/**
 * The full-bleed celebrations plate — the reference's pink-washed banquet
 * photograph with a centred serif line across it.
 *
 * The wash here is the wine from the wordmark rather than a pink, and it is
 * strong enough (roughly 70% over the photograph) that the white type clears
 * AA against every part of the picture, not just the dark corners.
 */
export function CelebrationsBand({ media }: { media?: Media | null }) {
  return (
    <section
      className="on-photo relative isolate overflow-hidden bg-wine-deep"
      aria-labelledby="celebrations-title"
    >
      <div className="absolute inset-0 -z-10">
        <MediaFrame media={media} ratio="auto" className="h-full w-full" sizes="100vw" />
      </div>
      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgb(92_20_40/0.66),rgb(43_10_22/0.78))]"
        aria-hidden="true"
      />

      <Reveal className="shell flex flex-col items-center py-20 text-center md:py-28">
        <p className="eyebrow">Weddings, birthdays and corporate offsites</p>

        <div className="ornament my-5 text-gold" aria-hidden="true">
          <PeakGlyph className="h-3 w-auto shrink-0" />
        </div>

        <h2 id="celebrations-title" className="text-h1 max-w-3xl font-display text-paper">
          Hold your <span className="signature">celebration</span> above the valley
        </h2>

        <p className="mt-6 max-w-xl text-paper/85">
          The open terrace seats a party under the pines with the whole valley
          below it, and the restaurant and lawns take the overflow. Tell us the
          date and the numbers and we will put a plan together.
        </p>

        <Link href="/facilities#events" className="btn btn-gold mt-9">
          Plan an event
        </Link>
      </Reveal>
    </section>
  );
}
