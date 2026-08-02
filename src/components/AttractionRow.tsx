import { MediaFrame } from "./MediaFrame";
import { PeakGlyph, PeakMark } from "./PeakMark";
import { Reveal } from "./Reveal";
import type { PhotoCredit } from "@/lib/attraction-photos";
import type { Attraction, Media } from "@/lib/types";

/**
 * One place to visit, laid out the way the reference lays out its
 * "Discover Solan" page: a wide photograph on one side, a panel of copy on
 * the other, the panel pulled over the photograph's edge, and the sides
 * swapping down the page.
 *
 * Every third panel is set on the deep green rather than on paper, which is
 * the reference's dark-charcoal panel in this site's colours — enough rhythm
 * that eleven rows do not read as one long list.
 */

/**
 * The plate shown until a photograph is uploaded.
 *
 * These are public landmarks, not the resort's property, so nothing is
 * bundled for them — and an empty grey box under a heading called
 * "Kasauli" looks like a bug. This says plainly what the frame is for and
 * carries the distance while it waits, so the row is still useful with no
 * image at all.
 */
function PlaceholderPlate({ attraction }: { attraction: Attraction }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-4 bg-mint px-6 py-16 text-center"
      role="img"
      aria-label={`No photograph of ${attraction.name} yet`}
    >
      <PeakMark className="h-8 w-auto text-green/25" />
      <p className="eyebrow">{attraction.category}</p>
      <p className="font-display text-[1.5rem] leading-tight text-green-deep">
        {attraction.distance_note}
      </p>
      <p className="max-w-[18rem] text-xs text-stone">
        A photograph of {attraction.name} can be added under Attractions in the
        admin panel.
      </p>
    </div>
  );
}

export function AttractionRow({
  attraction,
  index,
  photo,
  credit,
}: {
  attraction: Attraction;
  index: number;
  /** A file dropped into `public/media/attractions/`, if there is one. */
  photo?: Media | null;
  /** Attribution for that file, where the licence requires it. */
  credit?: PhotoCredit | null;
}) {
  const imageLeft = index % 2 === 0;
  const dark = index % 3 === 0;
  const headingId = `attraction-${attraction.slug}`;

  // An upload attached in /admin always wins over a dropped-in file.
  const image = attraction.image ?? photo ?? null;

  return (
    <Reveal
      as="article"
      className={`scroll-mt-24 ${index % 4 === 0 || index % 4 === 3 ? "" : "on-cream"}`}
    >
      <div
        id={attraction.slug}
        className="shell grid items-center gap-6 py-10 md:py-14 lg:grid-cols-12 lg:gap-0"
      >
        {/* Photograph */}
        <div
          className={`lg:col-span-7 ${imageLeft ? "" : "lg:order-2"}`}
        >
          <div className="aspect-[16/10] w-full">
            {image ? (
              <MediaFrame
                media={{ ...image, alt: image.alt || attraction.name }}
                ratio="16 / 10"
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="h-full"
                zoom
              />
            ) : (
              <PlaceholderPlate attraction={attraction} />
            )}
          </div>

          {/*
            Nearly every freely-licensed photograph of these places requires
            attribution, so the credit is rendered rather than buried in a
            file — if it is not on the page, the licence is not being met.
          */}
          {image && credit?.author ? (
            <p className="mt-2 text-[0.6875rem] leading-snug text-stone">
              Photograph:{" "}
              {credit.source ? (
                <a
                  href={credit.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline"
                >
                  {credit.author}
                </a>
              ) : (
                credit.author
              )}
              {credit.licence ? ` · ${credit.licence}` : null}
            </p>
          ) : null}
        </div>

        {/* Copy panel, pulled over the photograph's inner edge from lg up. */}
        <div
          className={`relative z-10 lg:col-span-5 ${
            imageLeft ? "lg:-ml-16" : "lg:order-1 lg:-mr-16"
          }`}
        >
          <div
            className={`px-6 py-8 text-center md:px-10 md:py-11 ${
              dark
                ? "on-green"
                : "border border-paper-edge bg-paper shadow-[0_24px_60px_-40px_rgb(8_64_42/0.5)]"
            }`}
          >
            <p className="eyebrow">{attraction.category}</p>

            <div className="ornament my-3.5 justify-center text-gold" aria-hidden="true">
              <PeakGlyph className="h-2.5 w-auto shrink-0" />
            </div>

            <h2
              id={headingId}
              className={`font-display text-[clamp(1.5rem,1.2rem+1vw,2rem)] leading-tight ${
                dark ? "text-paper" : ""
              }`}
            >
              {attraction.name}
            </h2>

            <p
              className={`mt-3 text-sm font-medium ${dark ? "text-gold-light" : "text-wine"}`}
            >
              {attraction.distance_note}
            </p>

            <p
              className={`mt-4 text-[0.9375rem] leading-relaxed ${
                dark ? "text-paper/85" : "text-stone"
              }`}
            >
              {attraction.description}
            </p>

            {attraction.highlights.length > 0 ? (
              <ul
                className={`mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[0.8125rem] ${
                  dark ? "text-paper/80" : "text-stone"
                }`}
              >
                {attraction.highlights.map((point) => (
                  <li key={point} className="before:mr-1.5 before:text-gold before:content-['◆']">
                    {point}
                  </li>
                ))}
              </ul>
            ) : null}

            {attraction.visit_note ? (
              <p
                className={`mt-5 border-t pt-4 text-xs leading-relaxed ${
                  dark ? "border-paper/20 text-paper/70" : "border-paper-edge text-stone"
                }`}
              >
                <span className="font-medium">Before you go — </span>
                {attraction.visit_note}
              </p>
            ) : null}

            {attraction.map_url ? (
              <a
                href={attraction.map_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`link-underline mt-5 inline-block text-[0.75rem] uppercase tracking-[0.16em] ${
                  dark ? "text-gold-light" : "text-wine"
                }`}
              >
                Open in maps
                <span className="sr-only"> — {attraction.name}</span>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
