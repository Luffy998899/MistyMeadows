import Link from "next/link";

import { EnquiryCard } from "@/components/admin/EnquiryCard";
import { createClient } from "@/lib/supabase/server";
import type { Enquiry } from "@/lib/types";

const FILTERS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "closed", label: "Closed" },
];

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = FILTERS.some((f) => f.value === status) ? (status ?? "") : "";

  const supabase = await createClient();

  let query = supabase.from("enquiries").select("*").order("created_at", { ascending: false });
  if (active) query = query.eq("status", active);

  const { data, error } = await query.limit(200);
  const enquiries = (data ?? []) as Enquiry[];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-h2">Enquiries</h1>
          <p className="mt-2 text-sm text-stone">
            Everything sent through the website enquiry form.
          </p>
        </div>

        <a href="/api/admin/enquiries.csv" className="btn btn-outline">
          Export CSV
        </a>
      </div>

      <nav aria-label="Filter by status" className="mt-7 flex flex-wrap gap-1">
        {FILTERS.map((filter) => {
          const isActive = filter.value === active;
          return (
            <Link
              key={filter.value}
              href={filter.value ? `/admin/enquiries?status=${filter.value}` : "/admin/enquiries"}
              aria-current={isActive ? "page" : undefined}
              className={`px-4 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-umber text-paper"
                  : "border border-paper-edge bg-paper text-stone hover:text-ink"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      {error ? (
        <p role="alert" className="mt-8 border-l-2 border-bark bg-paper p-4 text-sm text-bark">
          Could not load enquiries: {error.message}
        </p>
      ) : enquiries.length === 0 ? (
        <div className="mt-8 border border-paper-edge bg-paper p-10 text-center">
          <p className="font-display text-h3">No enquiries {active ? `marked ${active}` : "yet"}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-stone">
            They will appear here as soon as someone uses the form on the
            contact page.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {enquiries.map((enquiry) => (
            <li key={enquiry.id}>
              <EnquiryCard enquiry={enquiry} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
