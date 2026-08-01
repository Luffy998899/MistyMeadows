import type { Metadata } from "next";
import Link from "next/link";

import { MediaFrame } from "@/components/MediaFrame";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { getDining } from "@/lib/content";

export const metadata: Metadata = {
  title: "Dining",
  description:
    "Multi-cuisine restaurant at Misty Meadows Resorts, Kumarhatti. Veg and non-veg thalis, and day picnic packages.",
};

export default async function DiningPage() {
  const dining = await getDining();

  const thalis = dining.filter((item) => item.category === "thali");
  const picnics = dining.filter((item) => item.category === "picnic");
  const other = dining.filter(
    (item) => item.category !== "thali" && item.category !== "picnic",
  );

  const groups = [
    { key: "thali", heading: "Thalis", items: thalis },
    { key: "picnic", heading: "Day picnic packages", items: picnics },
    { key: "other", heading: "Also on the menu", items: other },
  ].filter((group) => group.items.length > 0);

  return (
    <>
      <PageHero
        eyebrow="Dining"
        title="The kitchen"
        lead="A multi-cuisine restaurant on the property, open through the day. The thali is what most guests settle on."
      />

      <section className="section pt-0">
        <div className="shell grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <MediaFrame
              media={thalis[0]?.image}
              ratio="4 / 5"
              sizes="(max-width: 1024px) 100vw, 40vw"
              priority
            />
          </div>

          <div className="space-y-14">
            {groups.map((group) => (
              <div key={group.key}>
                <h2 className="text-h2">{group.heading}</h2>

                <ul className="mt-7 border-t border-paper-edge">
                  {group.items.map((item) => (
                    <li key={item.id} className="border-b border-paper-edge py-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                        <h3 className="font-display text-[1.25rem]">{item.name}</h3>
                        {item.price_note ? (
                          <p className="whitespace-nowrap text-sm text-burgundy">
                            {item.price_note}
                          </p>
                        ) : null}
                      </div>
                      {item.detail ? (
                        <p className="mt-1.5 text-sm text-stone">{item.detail}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <p className="text-sm text-stone">
              All rates are exclusive of GST. Menus and packages can be adjusted
              for groups and events — tell us your numbers and we will quote.
            </p>

            <Link href="/contact" className="btn btn-solid">
              Enquire about dining
            </Link>
          </div>
        </div>
      </section>

      <section className="section bg-paper-warm">
        <div className="shell">
          <SectionHeading
            eyebrow="Groups & events"
            title="Day picnics and functions"
            lead="The restaurant and conference room can be booked together for day groups, offsites and family functions. Rates above are per person, before tax."
          />
        </div>
      </section>
    </>
  );
}
