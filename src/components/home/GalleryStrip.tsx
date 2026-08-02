import Link from "next/link";

import { MediaFrame } from "@/components/MediaFrame";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import type { Media } from "@/lib/types";

/**
 * An eight-plate strip onto the gallery — two tidy rows of four rather than
 * a feature plate with spans, which leaves a hole in the grid the moment the
 * owner publishes an odd number of photographs.
 */
export function GalleryStrip({ images }: { images: Media[] }) {
  const plates = images.slice(0, 8);
  if (plates.length === 0) return null;

  return (
    <section className="section" aria-labelledby="gallery-title">
      <div className="shell">
        <Reveal>
          <SectionHeading
            eyebrow="A look around"
            title={<span id="gallery-title">The resort in pictures</span>}
          />
        </Reveal>

        <ul className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
          {plates.map((media, i) => (
            <Reveal as="li" key={`${media.id}-${i}`} delay={(i % 4) * 70}>
              <Link href="/gallery" className="block" aria-label={`Gallery: ${media.alt}`}>
                <MediaFrame
                  media={media}
                  ratio="1 / 1"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  zoom
                />
              </Link>
            </Reveal>
          ))}
        </ul>

        <div className="mt-10 flex justify-center">
          <Link href="/gallery" className="btn btn-outline">
            Open the gallery
          </Link>
        </div>
      </div>
    </section>
  );
}
