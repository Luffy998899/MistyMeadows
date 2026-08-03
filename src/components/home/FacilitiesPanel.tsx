import Link from "next/link";

import { Icon } from "@/components/Icon";
import { MediaFrame } from "@/components/MediaFrame";
import { PeakGlyph } from "@/components/PeakMark";
import { Reveal } from "@/components/Reveal";
import type { Facility, Media } from "@/lib/types";

/**
 * The split facilities panel: a photograph filling the left half with the
 * heading laid over it, and a grid of pale cards on the right.
 *
 * On the reference the two halves are exactly 50/50 and the cards sit in a
 * 2×2. That holds here from `lg` up; below it the photograph becomes a
 * banner and the cards fall to a single column, because a 2×2 of cards at
 * 375px leaves no room for the descriptions.
 */
export function FacilitiesPanel({
  facilities,
  media,
}: {
  facilities: Facility[];
  media?: Media | null;
}) {
  if (facilities.length === 0) return null;

  const cards = facilities.slice(0, 4);

  return (
    <section className="relative isolate" aria-labelledby="facilities-title">
      <div className="grid lg:grid-cols-2">
        {/* Photograph half */}
        <div className="on-photo relative isolate min-h-[22rem] overflow-hidden bg-green-ink lg:min-h-[34rem]">
          <div className="absolute inset-0 -z-10">
            <MediaFrame
              media={media}
              ratio="auto"
              className="h-full w-full"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div
            className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgb(26_20_17/0.88),rgb(26_20_17/0.55))]"
            aria-hidden="true"
          />

          <Reveal className="flex h-full flex-col justify-center px-6 py-16 md:px-12 lg:py-20 lg:pl-[max(2.5rem,calc((100vw-82rem)/2+3.5rem))] lg:pr-14">
            <p className="eyebrow">On the property</p>

            <div className="ornament ornament-start my-4 max-w-[13rem] text-gold" aria-hidden="true">
              <PeakGlyph className="h-2.5 w-auto shrink-0" />
            </div>

            <h2 id="facilities-title" className="text-h2 font-display text-paper">
              Everything you need, on the hill
            </h2>

            <p className="mt-5 max-w-md text-paper/85">
              A multi-cuisine kitchen, a conference room for offsites, indoor
              games and a gym, and enough parking that nobody has to leave a car
              on the Nahan road.
            </p>

            <Link href="/facilities" className="btn btn-outline mt-8 self-start">
              Explore all
            </Link>
          </Reveal>
        </div>

        {/* Cards half */}
        <div className="on-cream flex items-center px-6 py-14 md:px-12 lg:py-20 lg:pl-14 lg:pr-[max(2.5rem,calc((100vw-82rem)/2+3.5rem))]">
          <ul className="grid w-full gap-4 sm:grid-cols-2">
            {cards.map((facility, i) => (
              <Reveal
                as="li"
                key={facility.id}
                delay={i * 100}
                className="card flex flex-col overflow-hidden"
              >
                {/* A photograph if the owner has attached one; the icon
                    carries the card on its own if not. */}
                {facility.image ? (
                  <MediaFrame
                    media={facility.image}
                    ratio="16 / 10"
                    sizes="(max-width: 640px) 100vw, 22vw"
                    zoom
                  />
                ) : null}

                <div className="flex flex-1 flex-col items-center px-5 py-7 text-center">
                  {facility.image ? null : (
                    <Icon name={facility.icon} className="h-8 w-8 text-green" />
                  )}
                  <h3
                    className={`font-display text-[1.1875rem] leading-snug text-ink ${
                      facility.image ? "" : "mt-4"
                    }`}
                  >
                    {facility.name}
                  </h3>
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-stone">
                    {facility.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
