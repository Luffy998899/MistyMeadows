import Link from "next/link";

import { MediaFrame } from "@/components/MediaFrame";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import type { Media, SiteSettings } from "@/lib/types";

/**
 * The welcome band. The reference sets its photograph inside a cusped Mughal
 * arch with a gold double rule; the same device is used here, drawn in CSS
 * (see `.arch-frame` / `.arch-outline`) so it scales and recolours rather
 * than shipping as a fixed bitmap.
 *
 * The picture in the slot is deliberately the misted terrace — it is the one
 * photograph on the property that explains the name.
 */
export function WelcomeBand({
  settings,
  media,
}: {
  settings: SiteSettings;
  media?: Media | null;
}) {
  // The seeded intro is a single long paragraph; split it so the band opens
  // with a readable lede rather than a wall.
  const sentences = settings.intro.split(/(?<=\.)\s+/);
  const lede = sentences.slice(0, 3).join(" ");
  const rest = sentences.slice(3).join(" ");

  return (
    <section className="on-blush section" aria-labelledby="welcome-title">
      <div className="shell grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
        <Reveal>
          <SectionHeading
            align="start"
            eyebrow="Welcome to Misty Meadows"
            title={
              <span id="welcome-title">
                A quiet resort, high in the <span className="signature text-green">pine</span>
              </span>
            }
          />

          <p className="text-lead mt-6 text-stone">{lede}</p>
          {rest ? <p className="mt-4 text-stone">{rest}</p> : null}

          <dl className="mt-9 grid max-w-md grid-cols-3 gap-6 border-t border-wine/15 pt-7">
            {[
              ["5,800 ft", "Above sea level"],
              ["1 hr 30", "From Chandigarh"],
              ["5 hr 30", "From Delhi"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="font-display text-[1.625rem] leading-none text-wine">{value}</dt>
                <dd className="eyebrow mt-2 leading-snug">{label}</dd>
              </div>
            ))}
          </dl>

          <Link href="/about" className="btn btn-solid mt-9">
            About the resort
          </Link>
        </Reveal>

        {/*
          The Reveal must stay a full-width grid item: `justify-self-center`
          would make it shrink-to-fit, and the `w-full` on the frame inside it
          would then resolve against an auto width and collapse to zero.
        */}
        <Reveal delay={140}>
          <div className="arch-outline mx-auto w-full max-w-[26rem]">
            <div className="arch-frame">
              <MediaFrame
                media={media}
                ratio="4 / 5"
                sizes="(max-width: 1024px) 80vw, 26rem"
                zoom
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
