import { NextResponse } from "next/server";
import { z } from "zod";

import { sendEnquiryNotification } from "@/lib/mail";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";

const EnquirySchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(120),
  email: z.string().trim().email("That email address does not look right").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  check_in: z.string().trim().max(20).optional().or(z.literal("")),
  check_out: z.string().trim().max(20).optional().or(z.literal("")),
  guests: z.coerce.number().int().min(1).max(60).optional(),
  room_name: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
  // Honeypot: a real person never fills this in, it is hidden from view.
  company: z.string().max(0).optional(),
});

/**
 * Very small in-memory throttle. This is a single-instance guard against a
 * bot hammering the form — it resets on deploy and does not span regions,
 * which is an accepted limitation for a resort enquiry form.
 */
const RATE_LIMIT = { windowMs: 60_000, max: 5 };
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);

  // Keep the map from growing without bound on a long-running instance.
  if (hits.size > 5_000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t > RATE_LIMIT.windowMs)) hits.delete(key);
    }
  }

  return recent.length > RATE_LIMIT.max;
}

/** Empty strings from the form become NULL rather than "". */
function orNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many enquiries from this connection. Please try again shortly." },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  const parsed = EnquirySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form and try again" },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Honeypot tripped — accept silently so the bot learns nothing.
  if (data.company) {
    return NextResponse.json({ ok: true, message: "Thank you — we will be in touch." });
  }

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[enquiry] Supabase is not configured; enquiry was not saved");
    return NextResponse.json(
      {
        error:
          "The enquiry form is not connected yet. Please call or email us in the meantime.",
      },
      { status: 503 },
    );
  }

  const record = {
    name: data.name,
    email: data.email,
    phone: orNull(data.phone),
    check_in: orNull(data.check_in),
    check_out: orNull(data.check_out),
    guests: data.guests ?? null,
    room_name: orNull(data.room_name),
    message: data.message?.trim() ?? "",
  };

  const supabase = createAdminClient();

  const { data: inserted, error } = await supabase
    .from("enquiries")
    .insert(record)
    .select("id")
    .single();

  if (error) {
    console.error(`[enquiry] insert failed: ${error.message}`);
    return NextResponse.json(
      { error: "We could not save your enquiry. Please call us instead." },
      { status: 500 },
    );
  }

  // The enquiry is safely stored at this point. Mail is best-effort: if it
  // fails the owner still sees the enquiry in the admin inbox, and the
  // failure reason is recorded against the row.
  const mail = await sendEnquiryNotification(record);

  await supabase
    .from("enquiries")
    .update({ mail_sent: mail.sent, mail_error: mail.error ?? null })
    .eq("id", inserted.id);

  return NextResponse.json({
    ok: true,
    message: "Thank you — we have your enquiry and will come back to you shortly.",
  });
}
