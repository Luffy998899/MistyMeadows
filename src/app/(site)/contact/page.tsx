import type { Metadata } from "next";
import { Suspense } from "react";

import { EnquiryForm } from "@/components/EnquiryForm";
import { PageHero } from "@/components/PageHero";
import { SocialLinks } from "@/components/SocialLinks";
import { getRooms, getSettings } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact & Enquiries",
  description:
    "Enquire about a stay at Misty Meadows Resorts, Kumarhatti, Nahan Road, Distt. Solan, Himachal Pradesh.",
};

export default async function ContactPage() {
  const [settings, rooms] = await Promise.all([getSettings(), getRooms()]);

  return (
    <>
      <PageHero
        eyebrow="Reservations"
        title="Enquire about a stay"
        lead="Send us your dates and we will come back with availability and the best rate we can do — usually the same day."
      />

      <section className="section pt-0">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-20">
          {/* useSearchParams needs a Suspense boundary during prerender. */}
          <Suspense fallback={<div className="border-t-2 border-umber pt-8" />}>
            <EnquiryForm rooms={rooms} />
          </Suspense>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border-t border-paper-edge pt-8">
              <h2 className="eyebrow">Call the resort</h2>
              <ul className="mt-4 space-y-1">
                {settings.phones.map((phone) => (
                  <li key={phone}>
                    <a
                      href={`tel:${phone.replace(/\s/g, "")}`}
                      className="link-underline font-display text-[1.375rem]"
                    >
                      {phone}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {settings.whatsapp ? (
              <div className="mt-8 border-t border-paper-edge pt-8">
                <h2 className="eyebrow">WhatsApp</h2>
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline mt-4 inline-block text-[0.9375rem]"
                >
                  Message us on WhatsApp
                </a>
              </div>
            ) : null}

            <div className="mt-8 border-t border-paper-edge pt-8">
              <h2 className="eyebrow">Email</h2>
              <ul className="mt-4 space-y-1">
                {settings.emails.map((email) => (
                  <li key={email}>
                    <a href={`mailto:${email}`} className="link-underline text-[0.9375rem]">
                      {email}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 border-t border-paper-edge pt-8">
              <h2 className="eyebrow">Address</h2>
              <address className="mt-4 not-italic leading-relaxed text-stone">
                {settings.address_lines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>

              {settings.map_url ? (
                <a
                  href={settings.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline mt-4 inline-block text-sm text-bark"
                >
                  Open in Google Maps
                </a>
              ) : null}
            </div>

            {Object.values(settings.socials).some(Boolean) ? (
              <div className="on-umber mt-8 p-6">
                <h2 className="eyebrow">Follow the resort</h2>
                <SocialLinks socials={settings.socials} className="mt-4" />
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </>
  );
}
