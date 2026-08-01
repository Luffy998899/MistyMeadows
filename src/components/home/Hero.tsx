import Link from "next/link";

import { MediaFrame } from "@/components/MediaFrame";
import type { SiteSettings } from "@/lib/types";

/**
 * The hero is a split, not a centred slogan: type holds the left column on
 * paper, the photograph runs off the right edge of the screen. The headline
 * states the one thing that is actually true of this property — every room
 * faces the valley — rather than a generic welcome.
 */
export function Hero({ settings }: { settings: SiteSettings }) {
  return (
    <section className="relative overflow-clip pt-[72px] md:pt-20">
      <div className="shell">
        <div className="grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-14 lg:py-20">
          <div className="rise">
            <p className="eyebrow">Kumarhatti · Kasauli Hills · Himachal Pradesh</p>

            <h1 className="text-display mt-6 leading-[0.94]">
              The valley,
              <br />
              from every
              <br />
              <span className="signature">window</span>
            </h1>

            <p className="text-lead mt-7 max-w-md text-stone">
              Misty Meadows sits at 5,800 ft in the Kasauli hills — tall pine on
              three sides, the valley on the fourth. An hour and a half from
              Chandigarh, five and a half from Delhi.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/contact" className="btn btn-solid">
                Enquire about a stay
              </Link>
              <Link href="/rooms" className="btn btn-outline">
                See the rooms
              </Link>
            </div>
          </div>

          {/*
            Bleeds off the right edge on large screens so the composition is
            asymmetric rather than a tidy two-column box.
          */}
          <div className="relative lg:-mr-[max(1rem,calc((100vw-84rem)/2+4rem))]">
            <MediaFrame
              media={settings.hero_media}
              ratio="4 / 3"
              sizes="(max-width: 1024px) 100vw, 55vw"
              priority
              className="w-full lg:aspect-[5/4]"
            />

            {/* Elevation plate — a real, sourced number, not a stat block. */}
            <div className="absolute -bottom-6 left-4 bg-paper px-5 py-4 sm:left-6 md:px-7 md:py-5">
              <p className="font-display text-[1.75rem] leading-none text-burgundy md:text-[2.25rem]">
                5,800 ft
              </p>
              <p className="eyebrow mt-2">Above sea level</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
