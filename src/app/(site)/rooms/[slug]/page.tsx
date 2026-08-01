import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MediaFrame } from "@/components/MediaFrame";
import { PeakGlyph } from "@/components/PeakMark";
import { formatRate } from "@/components/RoomCard";
import { getRoom, getRooms } from "@/lib/content";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const room = await getRoom(slug);

  if (!room) return { title: "Room not found" };

  return {
    title: room.name,
    description: room.summary,
  };
}

export default async function RoomPage({ params }: Params) {
  const { slug } = await params;
  const [room, allRooms] = await Promise.all([getRoom(slug), getRooms()]);

  if (!room) notFound();

  const others = allRooms.filter((r) => r.slug !== room.slug).slice(0, 3);

  return (
    <>
      <article className="pt-[72px] md:pt-20">
        <div className="shell pt-12 md:pt-16">
          <Link href="/rooms" className="link-underline text-sm text-stone">
            ← All rooms
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:gap-16">
            <div>
              <h1 className="text-h1">{room.name}</h1>
              <p className="text-lead mt-5 text-stone">{room.summary}</p>

              <div className="mt-8">
                <MediaFrame
                  media={room.image}
                  ratio="3 / 2"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                />
              </div>

              {room.description ? (
                <p className="mt-8 max-w-prose leading-relaxed text-stone">
                  {room.description}
                </p>
              ) : null}
            </div>

            {/* Rate + facts rail */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="border-t-2 border-umber pt-6">
                <p className="font-display text-[2rem] leading-none text-bark">
                  {formatRate(room)}
                </p>
                <p className="mt-2 text-sm text-stone">
                  {room.rate_inr ? room.rate_note : "Send us your dates for a quote"}
                </p>

                <dl className="mt-7 space-y-3 border-t border-paper-edge pt-6 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-stone">Sleeps</dt>
                    <dd>{room.max_guests} guests</dd>
                  </div>
                  {room.size_note ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-stone">Size</dt>
                      <dd>{room.size_note}</dd>
                    </div>
                  ) : null}
                </dl>

                {room.features.length > 0 ? (
                  <ul className="mt-7 space-y-2.5 border-t border-paper-edge pt-6 text-sm">
                    {room.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <PeakGlyph className="mt-1 h-2.5 w-auto shrink-0 text-clay" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <Link
                  href={`/contact?room=${encodeURIComponent(room.name)}`}
                  className="btn btn-solid mt-8 w-full"
                >
                  Enquire about this room
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {others.length > 0 ? (
        <section className="section" aria-labelledby="other-rooms">
          <div className="shell">
            <h2 id="other-rooms" className="text-h2">
              Other rooms
            </h2>

            <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((other) => (
                <li key={other.id}>
                  <Link href={`/rooms/${other.slug}`} className="group block">
                    <MediaFrame
                      media={other.image}
                      ratio="4 / 3"
                      sizes="(max-width: 640px) 100vw, 33vw"
                      zoom
                    />
                    <h3 className="text-h3 mt-4 font-display group-hover:text-bark">
                      {other.name}
                    </h3>
                    <p className="mt-2 text-sm text-stone">{other.summary}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
