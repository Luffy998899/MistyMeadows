import type { Metadata } from "next";
import Link from "next/link";

import { BookingBenefits } from "@/components/BookingBenefits";
import { EmptyState } from "@/components/EmptyState";
import { FacilitiesGrid } from "@/components/FacilitiesGrid";
import { MediaFrame } from "@/components/MediaFrame";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { getFacilities, getSettings } from "@/lib/content";
import { IMAGES } from "@/lib/media-library";

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
        media={IMAGES.roomBalcony}
      />

      <section className="section">
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
              <h2 className="text-h2">Conferences &amp; offsites</h2>
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

      {/*
        Banquets and celebrations. The home page links straight here, so the
        section carries the anchor and repeats the terrace photograph that
        the celebrations plate uses, rather than sending the guest to a band
        they have already read.
      */}
      <section id="events" className="on-mint section scroll-mt-24">
        <div className="shell grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <MediaFrame
            media={IMAGES.celebrations}
            ratio="4 / 3"
            sizes="(max-width: 1024px) 100vw, 46vw"
            zoom
          />

          <div>
            <SectionHeading
              align="start"
              eyebrow="Weddings, birthdays, offsites"
              title="Banquets & celebrations"
            />
            <p className="mt-6 text-stone">
              The open terrace seats a party under the pines with the whole
              valley below it; the restaurant takes a hundred covers, and the
              lawns and forecourt hold the overflow. Rooms for the party are on
              the same property, so nobody is driving back down the hill at
              midnight.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-stone">
              {[
                "Open-air terrace dining, lit for the evening",
                "Multi-cuisine catering, vegetarian and non-vegetarian",
                "Rooms and long-stay apartments for the party",
                "Parking on site for day guests",
              ].map((point) => (
                <li key={point} className="before:mr-2 before:text-gold before:content-['◆']">
                  {point}
                </li>
              ))}
            </ul>
            <Link href="/contact" className="btn btn-solid mt-8">
              Enquire about an event
            </Link>
          </div>
        </div>
      </section>

      <div className="on-cream">
        <BookingBenefits benefits={benefits} note={settings.booking_note} />
      </div>
    </>
  );
}
