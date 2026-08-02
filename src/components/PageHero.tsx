import type { Media } from "@/lib/types";

import { MediaFrame } from "./MediaFrame";
import { PeakGlyph } from "./PeakMark";

/**
 * Interior page opener: a photographic banner with the title centred over
 * it, matching the reference's inner pages and the home page's own hero.
 *
 * With no photograph it falls back to a plain green plate rather than a grey
 * box, so a page whose image has not been set still opens deliberately.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  media,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  media?: Media | null;
  children?: React.ReactNode;
}) {
  return (
    <section className="on-photo relative isolate overflow-hidden bg-green-ink">
      {media ? (
        <div className="absolute inset-0 -z-10">
          <MediaFrame
            media={media}
            ratio="auto"
            className="h-full w-full"
            sizes="100vw"
            priority
          />
        </div>
      ) : null}

      <div
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgb(8_64_42/0.72),rgb(8_64_42/0.84))]"
        aria-hidden="true"
      />

      <div className="shell flex flex-col items-center py-16 text-center md:py-24">
        <p className="eyebrow">{eyebrow}</p>

        <div className="ornament my-4 text-gold" aria-hidden="true">
          <PeakGlyph className="h-2.5 w-auto shrink-0" />
        </div>

        <h1 className="text-h1 max-w-3xl font-display text-paper">{title}</h1>

        {lead ? <p className="mt-6 max-w-xl text-paper/85">{lead}</p> : null}

        {children}
      </div>
    </section>
  );
}
