"use client";

import { useActionState } from "react";

import { updateEnquiry, type ActionResult } from "@/app/admin/actions";
import type { Enquiry } from "@/lib/types";

const STATUSES: { value: Enquiry["status"]; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "closed", label: "Closed" },
];

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EnquiryCard({ enquiry }: { enquiry: Enquiry }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (previous, formData) => updateEnquiry(enquiry.id, formData),
    null,
  );

  const nights =
    enquiry.check_in && enquiry.check_out
      ? Math.round(
          (new Date(enquiry.check_out).getTime() - new Date(enquiry.check_in).getTime()) /
            86_400_000,
        )
      : null;

  return (
    <details className="group border border-paper-edge bg-paper open:border-gold/60">
      <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 p-4 marker:content-none">
        <span className="font-display text-[1.0625rem]">{enquiry.name}</span>

        <span className="text-sm text-stone">{enquiry.room_name || "No room preference"}</span>

        <span className="ml-auto flex items-center gap-3">
          {!enquiry.mail_sent ? (
            <span
              className="text-xs text-wine"
              title={enquiry.mail_error ?? "Not emailed"}
            >
              not emailed
            </span>
          ) : null}
          <span
            className={`px-2.5 py-1 text-[0.6875rem] uppercase tracking-[0.12em] ${
              enquiry.status === "new"
                ? "bg-green-ink text-paper"
                : "border border-paper-edge text-stone"
            }`}
          >
            {enquiry.status}
          </span>
          <span className="text-xs text-stone">{formatDate(enquiry.created_at)}</span>
        </span>
      </summary>

      <div className="border-t border-paper-edge p-4">
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {[
            ["Email", <a key="e" href={`mailto:${enquiry.email}`} className="link-underline text-wine">{enquiry.email}</a>],
            ["Phone", enquiry.phone ? <a key="p" href={`tel:${enquiry.phone}`} className="link-underline text-wine">{enquiry.phone}</a> : "—"],
            ["Check in", formatDate(enquiry.check_in)],
            ["Check out", formatDate(enquiry.check_out) + (nights ? ` (${nights} night${nights === 1 ? "" : "s"})` : "")],
            ["Guests", enquiry.guests ?? "—"],
            ["Room", enquiry.room_name || "—"],
          ].map(([term, value], i) => (
            <div key={i} className="grid grid-cols-[6rem_1fr] gap-3 text-sm">
              <dt className="text-stone">{term as string}</dt>
              <dd className="min-w-0 break-words">{value as React.ReactNode}</dd>
            </div>
          ))}
        </dl>

        {enquiry.message ? (
          <p className="mt-4 whitespace-pre-wrap border-l-2 border-paper-edge bg-paper-warm p-4 text-sm">
            {enquiry.message}
          </p>
        ) : null}

        {enquiry.mail_error ? (
          <p className="mt-4 text-xs text-wine">
            Email could not be sent: {enquiry.mail_error}
          </p>
        ) : null}

        <form action={formAction} className="mt-5 border-t border-paper-edge pt-5">
          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <div>
              <label htmlFor={`status-${enquiry.id}`} className="field-label">
                Status
              </label>
              <select
                id={`status-${enquiry.id}`}
                name="status"
                defaultValue={enquiry.status}
                className="field bg-paper"
              >
                {STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={`note-${enquiry.id}`} className="field-label">
                Internal note
              </label>
              <input
                id={`note-${enquiry.id}`}
                name="admin_note"
                defaultValue={enquiry.admin_note ?? ""}
                placeholder="Quoted ₹6,000, awaiting confirmation"
                className="field bg-paper"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <button type="submit" className="btn btn-outline !min-h-0 !px-5 !py-2 !text-[0.6875rem]" disabled={pending}>
              {pending ? "Saving…" : "Update"}
            </button>
            {state?.message ? (
              <span role="status" className="text-xs text-wine">
                {state.message}
              </span>
            ) : null}
            {state?.error ? (
              <span role="alert" className="text-xs text-wine">
                {state.error}
              </span>
            ) : null}
          </div>
        </form>
      </div>
    </details>
  );
}
