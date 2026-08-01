import { PeakGlyph } from "@/components/PeakMark";

/**
 * A slow horizontal drift of the hill stations around Kumarhatti.
 *
 * This is the page's one orchestrated motion moment. Names only — no
 * distances, because approximate drive times vary enough by route that
 * publishing a number would be guessing. It pauses on hover and is frozen
 * entirely under prefers-reduced-motion.
 */
const NEARBY = ["Kasauli", "Dagshai", "Barog", "Sanawar", "Solan", "Chail"];

export function NearbyBand() {
  // Rendered twice so the -50% translate loops seamlessly.
  const track = [...NEARBY, ...NEARBY];

  return (
    <section className="on-pine overflow-clip py-14 md:py-20" aria-labelledby="nearby-title">
      <div className="shell">
        <div className="peak-rule mb-8 text-mist">
          <PeakGlyph className="h-3 w-auto shrink-0" />
          <h2 id="nearby-title" className="eyebrow whitespace-nowrap">
            Within an easy drive
          </h2>
        </div>
      </div>

      <div className="group relative flex select-none overflow-hidden" aria-hidden="true">
        <ul className="marquee-track flex shrink-0 items-baseline gap-10 pr-10 group-hover:[animation-play-state:paused] md:gap-16 md:pr-16">
          {track.map((place, i) => (
            <li
              key={`${place}-${i}`}
              className="font-display text-[clamp(2.5rem,1.5rem+4vw,5rem)] leading-none whitespace-nowrap text-paper/85"
            >
              {place}
              <span className="ml-10 align-middle text-mist/40 md:ml-16">·</span>
            </li>
          ))}
        </ul>
      </div>

      {/* The visible list is decorative; this is what assistive tech reads. */}
      <p className="sr-only">
        Nearby hill stations: {NEARBY.join(", ")}.
      </p>
    </section>
  );
}
