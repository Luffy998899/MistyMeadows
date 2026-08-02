import Link from "next/link";

import { MediaFrame } from "@/components/MediaFrame";
import { PeakGlyph } from "@/components/PeakMark";
import type { Media } from "@/lib/types";

/**
 * Two rows of hill-station names drifting in opposite directions over a
 * photograph — the counter-scrolling band from the reference.
 *
 * Names only: approximate drive times vary enough by route that publishing
 * a number would be guessing. Both rows pause on hover and are frozen
 * entirely under prefers-reduced-motion.
 */
const NEARBY = ["Kasauli", "Dagshai", "Barog", "Sanawar", "Solan", "Chail"];

function Row({ reverse = false }: { reverse?: boolean }) {
  // Rendered twice so the -50% translate loops seamlessly.
  const track = [...NEARBY, ...NEARBY];

  return (
    <ul
      className={`flex shrink-0 items-baseline gap-10 pr-10 group-hover:[animation-play-state:paused] md:gap-16 md:pr-16 ${
        reverse ? "marquee-track-reverse" : "marquee-track"
      }`}
    >
      {track.map((place, i) => (
        <li
          key={`${place}-${i}`}
          className={`whitespace-nowrap font-display text-[clamp(2.5rem,1.4rem+4.4vw,5.5rem)] leading-none ${
            reverse
              ? "text-paper/45 [-webkit-text-stroke:1px_rgb(244_237_228/0.55)]"
              : "text-paper/90"
          }`}
        >
          {place}
          <span className="ml-10 align-middle text-linen/65 md:ml-16">·</span>
        </li>
      ))}
    </ul>
  );
}

export function NearbyBand({ media }: { media?: Media | null }) {
  // `on-green` rather than a bare background utility: it also recolours the
  // eyebrow, which otherwise inherits the dark muted tone and lands at
  // 1.8:1 against this ground.
  return (
    <section
      className="on-green relative isolate overflow-clip py-16 md:py-24"
      aria-labelledby="nearby-title"
    >
      {/* Photograph sits behind the type when one has been uploaded. */}
      {media?.public_url ? (
        <div className="absolute inset-0 -z-10 opacity-45">
          <MediaFrame media={media} ratio="auto" className="h-full w-full" sizes="100vw" />
        </div>
      ) : null}

      <div className="shell">
        <div className="ornament ornament-start mb-9 text-linen">
          <PeakGlyph className="h-3 w-auto shrink-0" />
          <h2 id="nearby-title" className="eyebrow whitespace-nowrap">
            Within an easy drive
          </h2>
        </div>
      </div>

      <div className="group flex flex-col gap-3 md:gap-5" aria-hidden="true">
        <div className="flex overflow-hidden">
          <Row />
        </div>
        <div className="flex overflow-hidden">
          <Row reverse />
        </div>
      </div>

      <div className="shell mt-10 flex justify-center md:mt-12">
        <Link href="/attractions" className="btn btn-outline">
          What to see nearby
        </Link>
      </div>

      {/* The rows are decorative; this is what assistive tech reads. */}
      <p className="sr-only">Nearby hill stations: {NEARBY.join(", ")}.</p>
    </section>
  );
}
