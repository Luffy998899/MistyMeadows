import Link from "next/link";

import type { Room } from "@/lib/types";

import { MediaFrame } from "./MediaFrame";

export function formatRate(room: Room): string {
  if (!room.rate_inr) return "Rates on request";
  return `₹${room.rate_inr.toLocaleString("en-IN")}`;
}

/**
 * The room card from the reference's accommodation grid: photograph, a rate
 * chip laid over its lower edge, then name, summary, features and a link.
 *
 * The whole card is not one big link — the heading and the "details" link
 * are. That keeps the feature list selectable and stops a screen reader
 * announcing a link whose accessible name runs to four sentences.
 */
export function RoomCard({ room, priority = false }: { room: Room; priority?: boolean }) {
  return (
    <article className="card flex h-full flex-col">
      <div className="relative">
        <Link href={`/rooms/${room.slug}`} tabIndex={-1} aria-hidden="true" className="block">
          <MediaFrame
            media={room.image}
            ratio="4 / 3"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            zoom
          />
        </Link>

        <p className="absolute bottom-0 left-0 bg-wine px-4 py-2 font-display text-[1.0625rem] leading-none text-paper">
          {formatRate(room)}
        </p>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-[1.375rem] leading-snug">
          <Link href={`/rooms/${room.slug}`} className="link-underline">
            {room.name}
          </Link>
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-stone">{room.summary}</p>

        {room.features.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.8125rem] text-stone">
            {room.features.slice(0, 4).map((feature) => (
              <li key={feature} className="before:mr-1.5 before:text-gold before:content-['◆']">
                {feature}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-4 border-t border-paper-edge pt-5">
          <p className="text-[0.8125rem] text-stone">
            {room.rate_inr ? room.rate_note : `Sleeps ${room.max_guests}`}
          </p>
          <Link
            href={`/rooms/${room.slug}`}
            className="link-underline text-[0.75rem] uppercase tracking-[0.16em] text-wine"
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}

/**
 * The editorial alternative: image on one side, copy on the other, sides
 * swapping down the page. Used where a room needs describing rather than
 * listing.
 */
export function RoomRow({ room, index }: { room: Room; index: number }) {
  const flip = index % 2 === 1;

  return (
    <article className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
      <Link
        href={`/rooms/${room.slug}`}
        className={`block ${flip ? "md:order-2" : ""}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        <MediaFrame
          media={room.image}
          ratio="3 / 2"
          sizes="(max-width: 768px) 100vw, 45vw"
          zoom
        />
      </Link>

      <div className={flip ? "md:order-1" : ""}>
        <p className="eyebrow">{String(index + 1).padStart(2, "0")}</p>

        <h3 className="text-h2 mt-3">
          <Link href={`/rooms/${room.slug}`} className="link-underline">
            {room.name}
          </Link>
        </h3>

        <p className="mt-4 max-w-md text-stone">{room.summary}</p>

        {room.features.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-stone">
            {room.features.map((feature) => (
              <li key={feature} className="before:mr-2 before:text-gold before:content-['◆']">
                {feature}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <p className="font-display text-h3 text-wine">{formatRate(room)}</p>
          <p className="text-sm text-stone">
            {room.rate_inr ? room.rate_note : `Sleeps ${room.max_guests}`}
          </p>
        </div>

        <Link href={`/rooms/${room.slug}`} className="btn btn-outline mt-7">
          Room detail
        </Link>
      </div>
    </article>
  );
}
