import type { Metadata } from "next";

import { EmptyState } from "@/components/EmptyState";
import { MediaFrame } from "@/components/MediaFrame";
import { PageHero } from "@/components/PageHero";
import { getGallery } from "@/lib/content";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photographs of Misty Meadows Resorts — rooms, the valley, the restaurant and the grounds.",
};

export default async function GalleryPage() {
  const items = await getGallery();

  // Group by the owner-set category so the page has structure rather than
  // being one long undifferentiated grid.
  const categories = [...new Set(items.map((item) => item.category))];

  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="The property, photographed"
        lead="Rooms, the valley, and the grounds."
      />

      <section className="section pt-0">
        <div className="shell">
          {items.length === 0 ? (
            <EmptyState
              title="No photographs yet"
              body="Upload images in the admin panel under Gallery and they will appear here."
            />
          ) : (
            <div className="space-y-16">
              {categories.map((category) => {
                const inCategory = items.filter((item) => item.category === category);

                return (
                  <section key={category} aria-label={category}>
                    <h2 className="eyebrow mb-6">{category}</h2>

                    {/*
                      Every third image runs full width, so the grid has a
                      rhythm instead of being a uniform tile field.
                    */}
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {inCategory.map((item, i) => (
                        <li
                          key={item.id}
                          className={i % 5 === 0 ? "sm:col-span-2 lg:col-span-2" : ""}
                        >
                          <figure>
                            <MediaFrame
                              media={item.media}
                              ratio={i % 5 === 0 ? "16 / 10" : "4 / 3"}
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              zoom
                            />
                            {item.caption ? (
                              <figcaption className="mt-2.5 text-sm text-stone">
                                {item.caption}
                              </figcaption>
                            ) : null}
                          </figure>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
