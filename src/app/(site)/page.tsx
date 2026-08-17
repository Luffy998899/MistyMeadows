import Link from "next/link";

import { BookingBenefits } from "@/components/BookingBenefits";
import { FacilitiesGrid } from "@/components/FacilitiesGrid";
import { MediaFrame } from "@/components/MediaFrame";
import { Parallax } from "@/components/Parallax";
import { Reveal } from "@/components/Reveal";
import { RoomRow } from "@/components/RoomCard";
import { SectionHeading } from "@/components/SectionHeading";
import { Testimonials } from "@/components/Testimonials";
import { Hero } from "@/components/home/Hero";
import { NearbyBand } from "@/components/home/NearbyBand";
import {
  getDining,
  getFacilities,
  getGallery,
  getRooms,
  getSettings,
  getTestimonials,
} from "@/lib/content";

export default async function HomePage() {
  const [settings, rooms, facilities, dining, testimonials, gallery] = await Promise.all([
    getSettings(),
    getRooms(),
    getFacilities(),
    getDining(),
    getTestimonials(),
    getGallery(),
  ]);

  const amenities = facilities.filter((f) => f.category === "facility");
  const benefits = facilities.filter((f) => f.category === "booking_benefit");
  const thalis = dining.filter((d) => d.category === "thali");

  // Gallery uploads double as the secondary hero plate and the backdrop for
  // the drifting band, so those compositions fill in on their own as the
  // owner adds photographs.
  const [firstGallery, secondGallery] = gallery;

  return (
    <>
      <Hero settings={settings} secondary={firstGallery?.media} />

      {/* The resort, in its own words */}
      <section className="section" aria-labelledby="about-title">
        <div className="shell grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
          <Reveal className="lg:sticky lg:top-28">
            <SectionHeading
              eyebrow="The resort"
              title={<span id="about-title">A quiet property, high in the pine</span>}
            />
            <Link href="/about" className="btn btn-outline mt-8">
              More about us
            </Link>
          </Reveal>

          <Reveal delay={120}>
            <p className="text-lead text-stone">{settings.intro}</p>

            {/* Drive times only — the elevation is already stated in the hero,
                and repeating it here would just be a stat row. */}
            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-paper-edge pt-8">
              {[
                ["From Chandigarh", "1 hr 30 min"],
                ["From Delhi", "5 hr 30 min"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="eyebrow">{label}</dt>
                  <dd className="mt-2 font-display text-[1.375rem] text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <NearbyBand media={secondGallery?.media ?? settings.hero_media} />

      {/* Rooms — an index, not a card grid */}
      <section className="section" aria-labelledby="rooms-title">
        <div className="shell">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Accommodation"
              title={
                <span id="rooms-title">
                  Where you&rsquo;ll <span className="signature text-bark">wake up</span>
                </span>
              }
              lead="From a quiet double to a suite with its own terrace — every room opens onto the Kasauli valley."
            />
            <Link href="/rooms" className="btn btn-outline">
              All rooms
            </Link>
          </Reveal>

          <div className="mt-14 space-y-16 md:mt-20 md:space-y-24">
            {rooms.slice(0, 3).map((room, i) => (
              <Reveal key={room.id}>
                <RoomRow room={room} index={i} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities */}
      {amenities.length > 0 ? (
        <section className="section on-almond" aria-labelledby="facilities-title">
          <div className="shell">
            <Reveal>
              <SectionHeading
                eyebrow="On the property"
                title={<span id="facilities-title">What is here</span>}
              />
            </Reveal>
            <div className="mt-12">
              <FacilitiesGrid facilities={amenities} />
            </div>
          </div>
        </section>
      ) : null}

      {/* Dining */}
      {thalis.length > 0 ? (
        <section className="section" aria-labelledby="dining-title">
          <div className="shell grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <Parallax>
                <MediaFrame
                  media={thalis[0]?.image}
                  ratio="4 / 3"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  zoom
                />
              </Parallax>
            </Reveal>

            <Reveal delay={120}>
              <SectionHeading
                eyebrow="Dining"
                title={
                  <span id="dining-title">
                    Thalis, served <span className="signature text-bark">all day</span>
                  </span>
                }
                lead="A multi-cuisine kitchen with a fixed thali at its centre — the thing most guests end up ordering twice."
              />

              <ul className="mt-9 border-t border-paper-edge">
                {thalis.map((item) => (
                  <li key={item.id} className="border-b border-paper-edge py-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <h3 className="font-display text-[1.25rem]">{item.name}</h3>
                      {item.price_note ? (
                        <p className="text-sm text-bark">{item.price_note}</p>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-sm text-stone">{item.detail}</p>
                  </li>
                ))}
              </ul>

              <Link href="/dining" className="btn btn-outline mt-8">
                Dining &amp; picnic rates
              </Link>
            </Reveal>
          </div>
        </section>
      ) : null}

      <Testimonials testimonials={testimonials} />

      <BookingBenefits benefits={benefits} note={settings.booking_note} />

      {/* Closing call to action */}
      <section className="on-umber section" aria-labelledby="enquire-title">
        <div className="shell max-w-3xl">
          <Reveal>
            <p className="eyebrow">Reservations</p>
            <h2 id="enquire-title" className="text-h1 display-soft mt-5">
              Tell us when you would like to come{" "}
              <span className="signature text-linen">up</span>
            </h2>
            <p className="text-lead mt-6 text-paper/75">
              Send us your dates and we will come back with availability and the
              best rate we can do — usually the same day.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-outline">
                Enquire about a stay
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
          </Reveal>
        </div>
      </section>
    </>
  );
}
