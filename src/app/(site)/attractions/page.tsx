import type { Metadata } from "next";
import Link from "next/link";

import { AttractionRow } from "@/components/AttractionRow";
import { EmptyState } from "@/components/EmptyState";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { loadAttractionPhotos } from "@/lib/attraction-photos";
import { getAttractions, getSettings } from "@/lib/content";
import { IMAGES } from "@/lib/media-library";

export const metadata: Metadata = {
  title: "Attractions & Things to Do",
  description:
    "What to see within a morning's drive of Misty Meadows Resorts, Kumarhatti — Dagshai, Kasauli, the Barog tunnel, Solan's temples, Karol Tibba and Chail.",
};

export default async function AttractionsPage() {
  const [attractions, settings] = await Promise.all([getAttractions(), getSettings()]);
  const { photos, credits } = loadAttractionPhotos();

  // The chip row is built from whatever categories are actually published,
  // so adding a row in the admin panel adds its category here too.
  const categories = [...new Set(attractions.map((a) => a.category))];

  return (
    <>
      <PageHero
        eyebrow="Explore the Kasauli hills"
        title="Discover Solan"
        lead="Everything below is within a morning's drive of the resort — some of it within a walk. Distances are quoted from Solan town, which is a short drive down the Kalka–Shimla road from us."
        media={IMAGES.heroPines}
      />

      {attractions.length === 0 ? (
        <section className="section">
          <div className="shell">
            <EmptyState
              title="Nothing listed yet"
              body="Add places to visit under Attractions in the admin panel and they will appear here."
            />
          </div>
        </section>
      ) : (
        <>
          {/* Jump list — eleven rows is a long page to scroll blind. */}
          {categories.length > 1 ? (
            <Reveal className="border-b border-paper-edge">
              <nav aria-label="Attractions by type" className="shell py-6">
                <ul className="flex flex-wrap items-center justify-center gap-2">
                  {attractions.map((a) => (
                    <li key={a.slug}>
                      <Link
                        href={`#${a.slug}`}
                        className="inline-flex border border-paper-edge px-3.5 py-1.5 text-[0.75rem] text-stone transition-colors hover:border-gold hover:text-wine"
                      >
                        {a.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </Reveal>
          ) : null}

          <div>
            {attractions.map((attraction, i) => (
              <AttractionRow
                key={attraction.id}
                attraction={attraction}
                index={i}
                photo={photos[attraction.slug]}
                credit={credits[attraction.slug]}
              />
            ))}
          </div>
        </>
      )}

      {/* Closing note: the front desk is the actual planning tool. */}
      <section className="on-green section" aria-labelledby="plan-title">
        <div className="shell">
          <Reveal>
            <SectionHeading
              eyebrow="Plan the day"
              title={<span id="plan-title">Ask us before you set off</span>}
              lead="Timings change with the season, the Kasauli road closes in bad weather, and half of these are better on a weekday. The front desk drives these roads every week — tell us what you feel like and we will tell you what is actually open."
            />
          </Reveal>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn btn-gold">
              Book your stay
            </Link>
            {settings.phones[0] ? (
              <a
                href={`tel:${settings.phones[0].replace(/\s/g, "")}`}
                className="btn btn-outline"
              >
                {settings.phones[0]}
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
