import Link from "next/link";
import { notFound } from "next/navigation";

import { BulkUpload } from "@/components/admin/BulkUpload";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { findResource } from "@/lib/admin/resources";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ resource: string }>;
  searchParams: Promise<{ saved?: string; deleted?: string }>;
};

/** Renders a list cell without dumping raw JSON for arrays/objects. */
function cell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ") || "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export default async function ResourceListPage({ params, searchParams }: Props) {
  const { resource: key } = await params;
  const { saved, deleted } = await searchParams;

  const resource = findResource(key);
  if (!resource) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from(resource.table)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as Record<string, unknown>[];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h2">{resource.label}</h1>
          {resource.blurb ? <p className="mt-2 text-sm text-stone">{resource.blurb}</p> : null}
        </div>
        <Link href={`/admin/${resource.key}/new`} className="btn btn-solid">
          Add {resource.singular.toLowerCase()}
        </Link>
      </div>

      {saved ? (
        <p role="status" className="mt-6 border-l-2 border-gold bg-paper p-4 text-sm">
          Saved. The website has been updated.
        </p>
      ) : null}
      {deleted ? (
        <p role="status" className="mt-6 border-l-2 border-gold bg-paper p-4 text-sm">
          Deleted.
        </p>
      ) : null}

      {resource.bulkUpload ? (
        <BulkUpload
          attachTo={resource.bulkUpload === true ? undefined : resource.bulkUpload}
          defaultCategory={
            // Reuse whatever category the last batch went into, so a second
            // folder of room photographs does not need retyping.
            String(rows[0]?.category ?? "")
          }
        />
      ) : null}

      {error ? (
        <p role="alert" className="mt-6 border-l-2 border-wine bg-paper p-4 text-sm text-wine">
          Could not load: {error.message}
        </p>
      ) : rows.length === 0 ? (
        <div className="mt-8 border border-paper-edge bg-paper p-10 text-center">
          <p className="font-display text-h3">Nothing here yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-stone">
            Add your first {resource.singular.toLowerCase()} and it will appear on
            the website straight away.
          </p>
          <Link href={`/admin/${resource.key}/new`} className="btn btn-solid mt-6">
            Add {resource.singular.toLowerCase()}
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto border border-paper-edge bg-paper">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-paper-edge">
                <th scope="col" className="eyebrow p-4 font-medium">
                  {resource.singular}
                </th>
                {resource.listFields?.map((field) => (
                  <th key={field.name} scope="col" className="eyebrow p-4 font-medium">
                    {field.label}
                  </th>
                ))}
                <th scope="col" className="eyebrow p-4 font-medium">
                  Visible
                </th>
                <th scope="col" className="p-4">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const id = String(row.id);
                const title = cell(row[resource.titleField]);

                return (
                  <tr key={id} className="border-b border-paper-edge last:border-0">
                    <th scope="row" className="p-4 text-left font-normal">
                      <Link
                        href={`/admin/${resource.key}/${id}`}
                        className="link-underline font-display text-[1rem]"
                      >
                        {title === "—" ? "(untitled)" : title}
                      </Link>
                    </th>

                    {resource.listFields?.map((field) => (
                      <td key={field.name} className="p-4 text-stone">
                        {cell(row[field.name])}
                      </td>
                    ))}

                    <td className="p-4">
                      {row.published ? (
                        <span className="text-wine">Live</span>
                      ) : (
                        <span className="text-stone">Hidden</span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-end gap-4">
                        {resource.publicPath && row.slug ? (
                          <a
                            href={resource.publicPath.replace(":slug", String(row.slug))}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-underline text-xs text-stone"
                          >
                            View ↗
                          </a>
                        ) : null}
                        <DeleteButton
                          resourceKey={resource.key}
                          id={id}
                          label={title === "—" ? "this entry" : title}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
