import type { Metadata } from "next";
import Link from "next/link";

import { MediaFrame } from "@/components/MediaFrame";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { Testimonials } from "@/components/Testimonials";
import { getSettings, getTestimonials } from "@/lib/content";
import { IMAGES } from "@/lib/media-library";

export const metadata: Metadata = {
  title: "About",
  description:
    "Misty Meadows Resorts sits at 5,800 ft in the Kasauli hills at Kumarhatti, Solan — an hour and a half from Chandigarh.",
};

export default async function AboutPage() {
  const [settings, testimonials] = await Promise.all([getSettings(), getTestimonials()]);

  return (
    <>
      <PageHero
        eyebrow="About the resort"
        title={
          <>
            In the lap of <span className="signature">nature</span>
          </>
        }
        media={IMAGES.panorama}
      />

      <section className="section">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-20">
          <div>
            <p className="text-lead text-stone">{settings.intro}</p>

            <p className="mt-6 leading-relaxed text-stone">
              The property runs to several blocks, with serviced apartments let
              by the month alongside the nightly rooms. There is a multi-cuisine
              restaurant, a conference room for corporate groups, and a
              clubhouse with a gym and table tennis.
            </p>
          </div>

          <MediaFrame
            media={settings.hero_media}
            ratio="4 / 5"
            sizes="(max-width: 1024px) 100vw, 40vw"
          />
        </div>
      </section>

      <section id="location" className="section on-cream scroll-mt-24">
        <div className="shell grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading eyebrow="Location" title="Getting here" />

            <address className="mt-8 not-italic leading-relaxed text-stone">
              {settings.address_lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>

            <dl className="mt-9 space-y-4 border-t border-paper-edge pt-7">
              {[
                ["From Chandigarh", "About 1 hour 30 minutes by road"],
                ["From Delhi", "About 5 hours 30 minutes by road"],
                ["Nearest hill stations", "Kasauli, Dagshai, Barog and Solan"],
              ].map(([term, detail]) => (
                <div key={term} className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:gap-6">
                  <dt className="eyebrow">{term}</dt>
                  <dd className="text-sm text-stone">{detail}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-9 flex flex-wrap gap-3">
              {settings.map_url ? (
                <a
                  href={settings.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  Open in Google Maps
                </a>
              ) : null}
              <Link href="/contact" className="btn btn-solid">
                Enquire about a stay
              </Link>
            </div>
          </div>

          {settings.map_embed_url ? (
            <div className="media-frame aspect-[4/3] w-full">
              <iframe
                src={settings.map_embed_url}
                title="Map showing the location of Misty Meadows Resorts"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full border-0"
              />
            </div>
          ) : (
            <MediaFrame media={null} ratio="4 / 3" />
          )}
        </div>
      </section>

      <Testimonials testimonials={testimonials} />
    </>
  );
}
