import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { VideoPlayer } from "./VideoPlayer";
import type { Video } from "@/lib/types";

/**
 * The films of the resort.
 *
 * One video gets the full width; more than one falls into a two-up grid, so
 * the section reads as a feature rather than a row of thumbnails when there
 * is only the one film — which is the usual case.
 *
 * Renders nothing at all when there are no videos: an empty "watch our film"
 * heading over a blank space is worse than the section not existing.
 */
export function VideoSection({
  videos,
  eyebrow = "Watch",
  title = "The resort, on film",
  lead,
  ground = "on-green",
}: {
  videos: Video[];
  eyebrow?: string;
  title?: string;
  lead?: string;
  /** A ground utility — `on-green`, `on-cream`, or "" for paper. */
  ground?: string;
}) {
  if (videos.length === 0) return null;

  const single = videos.length === 1;

  return (
    <section className={`section ${ground}`} aria-labelledby="videos-title">
      <div className="shell">
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow}
            title={<span id="videos-title">{title}</span>}
            lead={lead}
          />
        </Reveal>

        <ul
          className={`mt-12 grid gap-6 ${single ? "mx-auto max-w-4xl" : "md:grid-cols-2"}`}
        >
          {videos.map((video, i) => (
            <Reveal as="li" key={video.id} delay={i * 90}>
              <VideoPlayer video={video} />
              {video.description ? (
                <p
                  className={`mt-3 text-sm leading-relaxed ${
                    ground === "on-green" ? "text-linen" : "text-stone"
                  }`}
                >
                  {video.description}
                </p>
              ) : null}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
