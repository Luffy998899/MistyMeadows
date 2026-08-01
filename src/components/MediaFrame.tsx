import Image from "next/image";

import type { Media } from "@/lib/types";

import { PeakGlyph } from "./PeakMark";

/**
 * Every image on the site goes through here.
 *
 * The owner uploads photography from /admin, so on a fresh install there is
 * nothing to show. Rather than a broken box or a grey rectangle, an empty
 * frame renders the peak motif on warm paper — it reads as a deliberate
 * plate, and the layout keeps its proportions either way.
 */
export function MediaFrame({
  media,
  ratio = "4 / 3",
  sizes = "100vw",
  priority = false,
  className = "",
  zoom = false,
  children,
}: {
  media?: Media | null;
  ratio?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  zoom?: boolean;
  children?: React.ReactNode;
}) {
  const isVideo = media?.kind === "video";

  return (
    <div
      className={`media-frame ${zoom ? "media-zoom" : ""} ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {media?.public_url ? (
        isVideo ? (
          <video
            src={media.public_url}
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            // A poster is not available for uploads, so keep it unobtrusive.
            aria-label={media.alt || undefined}
          />
        ) : (
          <Image
            src={media.public_url}
            alt={media.alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
        )
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-paper-warm"
          aria-hidden="true"
        >
          <PeakGlyph className="h-8 w-auto text-paper-edge" />
        </div>
      )}
      {children}
    </div>
  );
}
