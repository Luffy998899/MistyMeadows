import Link from "next/link";

import { RESOURCES } from "@/lib/admin/resources";
import { getMailSettings, isMailConfigured } from "@/lib/mail";
import { createClient } from "@/lib/supabase/server";
import type { Enquiry } from "@/lib/types";

export default async function AdminHome() {
  const supabase = await createClient();

  // Counts for each content type, plus the enquiry inbox state.
  const [counts, newEnquiries, recent, mail] = await Promise.all([
    Promise.all(
      RESOURCES.map(async (resource) => {
        const { count } = await supabase
          .from(resource.table)
          .select("*", { count: "exact", head: true });
        return { resource, count: count ?? 0 };
      }),
    ),
    supabase.from("enquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase
      .from("enquiries")
      .select("id, name, email, room_name, created_at, status")
      .order("created_at", { ascending: false })
      .limit(5),
    getMailSettings(),
  ]);

  const newCount = newEnquiries.count ?? 0;
  const recentEnquiries = (recent.data ?? []) as Pick<
    Enquiry,
    "id" | "name" | "email" | "room_name" | "created_at" | "status"
  >[];

  return (
    <>
      <h1 className="text-h2">Overview</h1>

      {!isMailConfigured(mail) ? (
        <div className="mt-6 border-l-2 border-bark bg-paper p-5">
          <h2 className="font-display text-[1.0625rem]">Email notifications are off</h2>
          <p className="mt-1.5 text-sm text-stone">
            Enquiries are still saved and listed here, but nothing is emailed to
            you yet. Add your SMTP details under{" "}
            <Link href="/admin/settings#mail" className="link-underline text-bark">
              Settings → Email
            </Link>
            .
          </p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/enquiries"
          className="border border-paper-edge bg-paper p-6 transition-colors hover:border-clay"
        >
          <p className="eyebrow">Enquiries</p>
          <p className="mt-3 font-display text-[2.25rem] leading-none text-bark">
            {newCount}
          </p>
          <p className="mt-2 text-sm text-stone">
            {newCount === 1 ? "new enquiry waiting" : "new enquiries waiting"}
          </p>
        </Link>

        <div className="border border-paper-edge bg-paper p-6">
          <p className="eyebrow">Recent</p>
          {recentEnquiries.length === 0 ? (
            <p className="mt-3 text-sm text-stone">No enquiries yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {recentEnquiries.map((enquiry) => (
                <li key={enquiry.id} className="flex justify-between gap-3 text-sm">
                  <span className="truncate">{enquiry.name}</span>
                  <span className="shrink-0 text-stone">
                    {new Date(enquiry.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h2 className="eyebrow mt-12">Content</h2>
      <ul className="mt-4 grid gap-px border border-paper-edge bg-paper-edge sm:grid-cols-2 lg:grid-cols-3">
        {counts.map(({ resource, count }) => (
          <li key={resource.key}>
            <Link
              href={`/admin/${resource.key}`}
              className="block h-full bg-paper p-5 transition-colors hover:bg-paper-warm"
            >
              <p className="font-display text-[1.0625rem]">{resource.label}</p>
              <p className="mt-1 text-sm text-stone">
                {count} {count === 1 ? "entry" : "entries"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
