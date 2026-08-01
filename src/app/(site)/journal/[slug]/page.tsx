import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MediaFrame } from "@/components/MediaFrame";
import { getPost } from "@/lib/content";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return { title: "Not found" };
  return { title: post.title, description: post.excerpt };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const date = post.event_date ?? post.published_at;

  return (
    <article className="pt-[72px] md:pt-20">
      <div className="shell pb-16 pt-12 md:pt-16">
        <Link href="/journal" className="link-underline text-sm text-stone">
          ← News &amp; events
        </Link>

        <header className="mt-8 max-w-3xl">
          <p className="eyebrow">
            {post.category}
            {date
              ? ` · ${new Date(date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}`
              : ""}
          </p>
          <h1 className="text-h1 mt-4">{post.title}</h1>
          {post.excerpt ? (
            <p className="text-lead mt-5 text-stone">{post.excerpt}</p>
          ) : null}
        </header>

        <div className="mt-10">
          <MediaFrame
            media={post.image}
            ratio="16 / 9"
            sizes="100vw"
            priority
          />
        </div>

        {/*
          Body is stored as plain text with blank lines between paragraphs —
          the admin editor is a textarea, not rich text, so there is no HTML
          to sanitise here.
        */}
        <div className="mt-10 max-w-prose space-y-5 leading-relaxed text-stone">
          {post.body
            .split(/\n\s*\n/)
            .filter(Boolean)
            .map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
        </div>
      </div>
    </article>
  );
}
