"use client";

import Image from "next/image";
import { useState } from "react";

import type { Video } from "@/lib/types";
import { embedUrlFor } from "@/lib/video";

/**
 * One video, click-to-play.
 *
 * Nothing loads until the guest asks for it: an uploaded file gets no
 * `preload`, and an embed's iframe is not in the document at all until the
 * play button is pressed. A page with three autoplaying embeds on it costs
 * a couple of megabytes and a great deal of goodwill on a hill-station
 * connection.
 */
export function VideoPlayer({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false);

  const embed = video.embed_url ? embedUrlFor(video.embed_url) : null;
  const file = video.media?.public_url ?? null;
  const poster = video.poster?.public_url ?? null;

  // Neither a playable file nor a recognised embed: link out rather than
  // render a dead frame.
  if (!file && !embed) {
    return video.embed_url ? (
      <a
        href={video.embed_url}
        target="_blank"
        rel="noopener noreferrer"
        className="media-frame flex aspect-video items-center justify-center bg-green-ink text-sm text-paper underline"
      >
        Watch “{video.title}”
      </a>
    ) : null;
  }

  if (!playing) {
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="media-frame media-zoom group relative block aspect-video w-full"
      >
        {poster ? (
          <Image
            src={poster}
            alt={video.poster?.alt || video.title}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
          />
        ) : (
          <span className="absolute inset-0 bg-green-ink" aria-hidden="true" />
        )}

        <span
          className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgb(8_64_42/0.35),rgb(8_64_42/0.6))]"
          aria-hidden="true"
        />

        <span className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-paper/70 text-paper transition-colors group-hover:border-paper group-hover:bg-paper group-hover:text-green-ink">
            <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7Z" />
            </svg>
          </span>
          <span className="px-6 font-display text-[1.25rem] text-paper drop-shadow-[0_2px_10px_rgb(6_38_25/0.7)]">
            {video.title}
          </span>
        </span>

        <span className="sr-only">Play “{video.title}”</span>
      </button>
    );
  }

  return (
    <div className="media-frame aspect-video w-full bg-green-ink">
      {file ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video
          src={file}
          poster={poster ?? undefined}
          controls
          autoPlay
          playsInline
          className="h-full w-full object-cover"
          aria-label={video.title}
        />
      ) : (
        <iframe
          src={`${embed}${embed?.includes("?") ? "&" : "?"}autoplay=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      )}
    </div>
  );
}
