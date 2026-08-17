import type { Metadata } from "next";

import { EmptyState } from "@/components/EmptyState";
import { GalleryGrid } from "@/components/GalleryGrid";
import { PageHero } from "@/components/PageHero";
import { VideoSection } from "@/components/VideoSection";
import { getGallery, getVideos } from "@/lib/content";
import { IMAGES } from "@/lib/media-library";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photographs of Misty Meadows Resorts — rooms, the valley, the restaurant and the grounds.",
};

export default async function GalleryPage() {
  const [items, videos] = await Promise.all([getGallery(), getVideos()]);
  const galleryVideos = videos.filter(
    (v) => v.placement === "gallery" || v.placement === "both",
  );

  return (
    <>
      <PageHero
        eyebrow="Gallery"
        title="Have a look"
        lead="Rooms, the valley, the restaurant and the grounds. Tap any photograph to see it full size."
        media={IMAGES.heroValley}
      />

      <section className="section">
        <div className="shell">
          {items.length === 0 ? (
            <EmptyState
              title="No photographs yet"
              body="Upload images in the admin panel under Gallery and they will appear here."
            />
          ) : (
            /*
              The grid, the category filter and the lightbox are one client
              component: filtering has to reset the open photograph, and
              splitting them would mean lifting that state into a wrapper for
              no gain. The page stays a server component and just hands it the
              rows.
            */
            <GalleryGrid items={items} />
          )}
        </div>
      </section>

      <VideoSection
        videos={galleryVideos}
        eyebrow="Watch"
        title="Films of the resort"
        ground="on-green"
      />
    </>
  );
}
