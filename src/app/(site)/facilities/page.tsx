import type { Metadata } from "next";
import Link from "next/link";

import { BookingBenefits } from "@/components/BookingBenefits";
import { EmptyState } from "@/components/EmptyState";
import { FacilitiesGrid } from "@/components/FacilitiesGrid";
import { PageHero } from "@/components/PageHero";
import { getFacilities, getSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "Facilities",
  description:
    "Multi-cuisine restaurant, conference room, clubhouse and parking at Misty Meadows Resorts, Kumarhatti, Solan.",
};

export default async function FacilitiesPage() {
  const [facilities, settings] = await Promise.all([getFacilities(), getSettings()]);

  const amenities = facilities.filter((f) => f.category === "facility");
  const benefits = facilities.filter((f) => f.category === "booking_benefit");

  return (
    <>
      <PageHero
        eyebrow="On the property"
        title="Facilities"
        lead="Everything on site, from the restaurant to the conference room."
      />

      <section className="section pt-0">
        <div className="shell">
          {amenities.length > 0 ? (
            <FacilitiesGrid facilities={amenities} />
          ) : (
            <EmptyState
              title="Facilities are being updated"
              body="Add them from the admin panel and they will appear here."
            />
          )}

          <div className="mt-14 grid gap-8 border-t border-paper-edge pt-12 md:grid-cols-2 md:gap-16">
            <div>
              <h2 className="text-h2">Conferences & offsites</h2>
              <p className="mt-5 text-stone">
                The conference room takes corporate groups, with the restaurant
                and rooms on the same property. Tell us your headcount and dates
                and we will put together a rate for the whole booking.
              </p>
              <Link href="/contact" className="btn btn-outline mt-7">
                Enquire about a group booking
              </Link>
            </div>

            <div>
              <h2 className="text-h2">Getting here</h2>
              <p className="mt-5 text-stone">
                {settings.address_lines.join(", ")}. An hour and a half from
                Chandigarh, about five and a half hours from Delhi.
              </p>
              {settings.map_url ? (
                <a
                  href={settings.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline mt-7"
                >
                  Open in Google Maps
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="bg-paper-warm">
        <BookingBenefits benefits={benefits} note={settings.booking_note} />
      </div>
    </>
  );
}
