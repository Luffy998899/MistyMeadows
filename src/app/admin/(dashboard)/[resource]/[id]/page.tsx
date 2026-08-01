import Link from "next/link";
import { notFound } from "next/navigation";

import { ResourceForm } from "@/components/admin/ResourceForm";
import { findResource } from "@/lib/admin/resources";
import { createClient } from "@/lib/supabase/server";
import type { Media } from "@/lib/types";

type Props = { params: Promise<{ resource: string; id: string }> };

export default async function ResourceEditPage({ params }: Props) {
  const { resource: key, id } = await params;

  const resource = findResource(key);
  if (!resource) notFound();

  const supabase = await createClient();
  const isNew = id === "new";

  let row: Record<string, unknown> = {};

  if (!isNew) {
    const { data } = await supabase.from(resource.table).select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    row = data as Record<string, unknown>;
  }

  // Resolve any media the row already points at, so the picker can show a
  // thumbnail rather than just an id.
  const mediaFields = resource.fields.filter((field) => field.type === "media");
  const mediaIds = mediaFields
    .map((field) => row[field.name])
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  const mediaById = new Map<string, Media>();
  if (mediaIds.length > 0) {
    const { data } = await supabase.from("media").select("*").in("id", mediaIds);
    for (const item of (data ?? []) as Media[]) mediaById.set(item.id, item);
  }

  const media: Record<string, Media | null> = {};
  for (const field of mediaFields) {
    const value = row[field.name];
    media[field.name] = typeof value === "string" ? (mediaById.get(value) ?? null) : null;
  }

  const title = String(row[resource.titleField] ?? "");

  return (
    <>
      <Link href={`/admin/${resource.key}`} className="link-underline text-sm text-stone">
        ← {resource.label}
      </Link>

      <h1 className="text-h2 mt-4">
        {isNew ? `New ${resource.singular.toLowerCase()}` : title || resource.singular}
      </h1>

      <ResourceForm resource={resource} id={id} row={row} media={media} />
    </>
  );
}
