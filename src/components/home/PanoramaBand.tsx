import { MediaFrame } from "@/components/MediaFrame";
import { Parallax } from "@/components/Parallax";
import type { Media } from "@/lib/types";

/**
 * A single full-bleed panorama, drifting slightly as it crosses the
 * viewport — the reference's wide "video" plate, without pretending there is
 * a film to play.
 *
 * The photograph is a genuine 1920×700 stitch of the entrance, gardens and
 * the sandstone carving by the door, so it is one of the few images on the
 * property that wants the whole width rather than a cropped box.
 */
export function PanoramaBand({ media, caption }: { media: Media; caption: string }) {
  return (
    <figure className="relative isolate">
      <Parallax distance={30}>
        <MediaFrame
          media={media}
          ratio="1920 / 700"
          sizes="100vw"
          className="max-h-[26rem] w-full"
        />
      </Parallax>

      {/*
        The caption sits under the plate rather than over it. Laid across the
        photograph it would have to rely on a gradient for legibility, and a
        gradient cannot be relied on: the panorama runs from bright sky to
        deep shadow, so the same overlay is either too weak at one end or too
        heavy at the other.
      */}
      <figcaption className="on-cream px-6 py-4 text-center text-sm text-stone">
        {caption}
      </figcaption>
    </figure>
  );
}
