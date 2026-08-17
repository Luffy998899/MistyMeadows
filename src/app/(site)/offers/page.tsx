import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/EmptyState";
import { MediaFrame } from "@/components/MediaFrame";
import { PageHero } from "@/components/PageHero";
import { getOffers } from "@/lib/content";
import { IMAGES } from "@/lib/media-library";

export const metadata: Metadata = {
  title: "Offers",
  description: "Seasonal offers and packages at Misty Meadows Resorts, Kasauli hills.",
};

function validity(from: string | null, to: string | null): string | null {
  const fmt = (value: string) =>
    new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  if (from && to) return `${fmt(from)} — ${fmt(to)}`;
  if (to) return `Until ${fmt(to)}`;
  if (from) return `From ${fmt(from)}`;
  return null;
}

export default async function OffersPage() {
  const offers = await getOffers();

  return (
    <>
      <PageHero
        eyebrow="Offers"
        title="Seasonal offers"
        lead="Packages and rates that run for part of the year. Book direct to use them."
        media={IMAGES.terraceValley}
      />

      <section className="section">
        <div className="shell">
          {offers.length === 0 ? (
            <EmptyState
              title="No offers running right now"
              body="Send us your dates and we will quote the best rate we can do."
            />
          ) : (
            <ul className="grid gap-10 md:grid-cols-2 lg:gap-14">
              {offers.map((offer) => {
                const dates = validity(offer.valid_from, offer.valid_to);

                return (
                  <li key={offer.id} className="flex flex-col">
                    <MediaFrame
                      media={offer.image}
                      ratio="16 / 10"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      zoom
                    />

                    {dates ? <p className="eyebrow mt-5">{dates}</p> : null}

                    <h2 className="text-h2 mt-3">{offer.title}</h2>
                    <p className="mt-3 flex-1 text-stone">{offer.summary}</p>

                    {offer.body ? (
                      <p className="mt-4 text-sm leading-relaxed text-stone">{offer.body}</p>
                    ) : null}

                    {offer.terms ? (
                      <p className="mt-4 text-xs text-stone">{offer.terms}</p>
                    ) : null}

                    <Link
                      href={`/contact?offer=${encodeURIComponent(offer.title)}`}
                      className="btn btn-outline mt-6 self-start"
                    >
                      Enquire
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
