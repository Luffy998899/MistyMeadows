import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/PageHero";
import { RoomCard } from "@/components/RoomCard";
import { SectionHeading } from "@/components/SectionHeading";
import { getApartments, getRooms } from "@/lib/content";
import { IMAGES } from "@/lib/media-library";

export const metadata: Metadata = {
  title: "Rooms & Suites",
  description:
    "Five room types at Misty Meadows Resorts, Kumarhatti — all facing the valley — plus long-stay apartments in Block B and Block C.",
};

export default async function RoomsPage() {
  const [rooms, apartments] = await Promise.all([getRooms(), getApartments()]);

  return (
    <>
      <PageHero
        eyebrow="Accommodation"
        title="Rooms & suites"
        lead="Five room types, all looking onto the valley. What changes between them is floor space and whether you get a balcony or a terrace."
        media={IMAGES.roomTerrace}
      />

      <section className="section" aria-label="Room types">
        <div className="shell">
          <SectionHeading
            eyebrow="Accommodation"
            title="Five ways to stay"
            lead="Every room looks onto the valley. The difference is how much space you have to look from."
          />

          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room, i) => (
              <li key={room.id}>
                <RoomCard room={room} priority={i < 3} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {apartments.length > 0 ? (
        <section id="apartments" className="section on-cream scroll-mt-24">
          <div className="shell">
            <SectionHeading
              eyebrow="Long stays"
              title="Independent accommodation"
              lead="Serviced apartments in Block B and Block C, let by the month."
            />

            <div className="mt-12 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <caption className="sr-only">
                  Monthly rates for independent apartments
                </caption>
                <thead>
                  <tr className="border-b border-paper-edge">
                    <th scope="col" className="eyebrow pb-3 pr-4 font-medium">
                      Apartment
                    </th>
                    <th scope="col" className="eyebrow pb-3 pr-4 font-medium">
                      Block
                    </th>
                    <th scope="col" className="eyebrow pb-3 pr-4 font-medium">
                      Detail
                    </th>
                    <th scope="col" className="eyebrow pb-3 text-right font-medium">
                      Per month
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {apartments.map((apartment) => (
                    <tr key={apartment.id} className="border-b border-paper-edge">
                      <th scope="row" className="py-4 pr-4 font-display text-[1.0625rem] font-normal">
                        {apartment.name}
                      </th>
                      <td className="py-4 pr-4 text-sm text-stone">{apartment.block}</td>
                      <td className="py-4 pr-4 text-sm text-stone">{apartment.detail}</td>
                      <td className="py-4 text-right font-display text-[1.0625rem] text-wine">
                        {apartment.rate_monthly_inr
                          ? `₹${apartment.rate_monthly_inr.toLocaleString("en-IN")}`
                          : "On request"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 text-sm text-stone">
              Rates are exclusive of applicable taxes.
            </p>

            <Link href="/contact" className="btn btn-solid mt-8">
              Enquire about a long stay
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}
