import type { Media } from "@/lib/types";

/**
 * Room walkthrough video.
 *
 * Deliberately *not* autoplaying: this is a piece of content a guest chooses
 * to watch, not background texture, so it ships with controls, no autoplay
 * and `preload="metadata"` — a room video is easily tens of megabytes and
 * many guests will be on mobile data.
 */
export function RoomVideo({ media }: { media: Media }) {
  if (!media.public_url) return null;

  return (
    <figure className="media-frame aspect-video w-full bg-green-ink">
      <video
        src={media.public_url}
        controls
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        aria-label={media.alt || "Room walkthrough video"}
      >
        {/* Shown only if the browser cannot play the file at all. */}
        <a href={media.public_url}>Download the room video</a>
      </video>
      {media.alt ? <figcaption className="sr-only">{media.alt}</figcaption> : null}
    </figure>
  );
}
