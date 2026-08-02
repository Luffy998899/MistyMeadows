import Link from "next/link";

import { MediaFrame } from "@/components/MediaFrame";
import { Parallax } from "@/components/Parallax";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import type { Media } from "@/lib/types";

/**
 * The alternating half-photograph / half-copy band the reference repeats
 * four times down its home page — rooms, the hotel at a glance, the banquet
 * hall, the open-air restaurant.
 *
 * One component rather than four near-identical sections: the only things
 * that change are the side the picture sits on, the ground it sits on, and
 * the copy. The text column centres itself within its half, matching the
 * reference, and the heading's ornament follows the column's alignment.
 */
export function FeatureBand({
  id,
  eyebrow,
  title,
  body,
  href,
  cta,
  media,
  side = "right",
  ground = "",
  accent,
}: {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  media?: Media | null;
  /** Which side the copy sits on. */
  side?: "left" | "right";
  /** A ground utility (`on-mint`, `on-cream`) or "" for paper. */
  ground?: string;
  /** Optional list of short points under the copy. */
  accent?: string[];
}) {
  const titleId = `${id}-title`;

  return (
    <section className={`section ${ground}`} aria-labelledby={titleId}>
      <div className="shell grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal className={side === "left" ? "lg:order-2" : ""}>
          <Parallax>
            <MediaFrame
              media={media}
              ratio="4 / 3"
              sizes="(max-width: 1024px) 100vw, 46vw"
              zoom
            />
          </Parallax>
        </Reveal>

        <Reveal delay={130} className={side === "left" ? "lg:order-1" : ""}>
          <SectionHeading
            eyebrow={eyebrow}
            title={<span id={titleId}>{title}</span>}
            className="lg:max-w-lg"
          />

          <p className="mt-6 text-center text-stone lg:max-w-lg lg:text-center">{body}</p>

          {accent && accent.length > 0 ? (
            <ul className="mx-auto mt-6 flex max-w-lg flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-stone">
              {accent.map((point) => (
                <li key={point} className="before:mr-2 before:text-gold before:content-['◆']">
                  {point}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-8 flex justify-center lg:max-w-lg">
            <Link href={href} className="btn btn-outline">
              {cta}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
