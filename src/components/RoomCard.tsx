import Link from "next/link";

import type { Room } from "@/lib/types";

import { MediaFrame } from "./MediaFrame";

export function formatRate(room: Room): string {
  if (!room.rate_inr) return "Rates on request";
  return `₹${room.rate_inr.toLocaleString("en-IN")}`;
}

/**
 * Rooms alternate their image side down the page, so the index reads as an
 * editorial list rather than a grid of identical cards.
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
              <li key={feature} className="before:mr-2 before:text-green before:content-['—']">
                {feature}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <p className="font-display text-h3 text-burgundy">{formatRate(room)}</p>
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
