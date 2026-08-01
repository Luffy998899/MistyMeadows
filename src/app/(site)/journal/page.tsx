import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/EmptyState";
import { MediaFrame } from "@/components/MediaFrame";
import { PageHero } from "@/components/PageHero";
import { getPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "News & Events",
  description: "News and upcoming events at Misty Meadows Resorts, Kumarhatti.",
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function JournalPage() {
  const posts = await getPosts();

  const [lead, ...rest] = posts;

  return (
    <>
      <PageHero
        eyebrow="News & events"
        title="From the resort"
        lead="What is happening on the property, and what is coming up."
      />

      <section className="section pt-0">
        <div className="shell">
          {posts.length === 0 ? (
            <EmptyState
              title="Nothing posted yet"
              body="Write your first update in the admin panel under News & Events."
            />
          ) : (
            <>
              {/* Lead story runs wide; the rest form a three-up index. */}
              <article className="grid gap-8 border-b border-paper-edge pb-14 md:grid-cols-2 md:gap-12">
                <Link href={`/journal/${lead.slug}`} tabIndex={-1} aria-hidden="true">
                  <MediaFrame
                    media={lead.image}
                    ratio="16 / 10"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                    zoom
                  />
                </Link>

                <div className="self-center">
                  <p className="eyebrow">
                    {lead.category}
                    {formatDate(lead.event_date ?? lead.published_at)
                      ? ` · ${formatDate(lead.event_date ?? lead.published_at)}`
                      : ""}
                  </p>
                  <h2 className="text-h2 mt-4">
                    <Link href={`/journal/${lead.slug}`} className="link-underline">
                      {lead.title}
                    </Link>
                  </h2>
                  <p className="mt-4 text-stone">{lead.excerpt}</p>
                </div>
              </article>

              {rest.length > 0 ? (
                <ul className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <li key={post.id}>
                      <Link href={`/journal/${post.slug}`} className="group block">
                        <MediaFrame
                          media={post.image}
                          ratio="4 / 3"
                          sizes="(max-width: 640px) 100vw, 33vw"
                          zoom
                        />
                        <p className="eyebrow mt-4">
                          {post.category}
                          {formatDate(post.event_date ?? post.published_at)
                            ? ` · ${formatDate(post.event_date ?? post.published_at)}`
                            : ""}
                        </p>
                        <h2 className="text-h3 mt-2 font-display group-hover:text-green">
                          {post.title}
                        </h2>
                        <p className="mt-2 text-sm text-stone">{post.excerpt}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </div>
      </section>
    </>
  );
}
