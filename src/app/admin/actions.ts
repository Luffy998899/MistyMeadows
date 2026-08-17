"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { findResource, slugify, type Field } from "@/lib/admin/resources";
import { sendTestEmail } from "@/lib/mail";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * All writes go through here.
 *
 * Two layers of authorisation on every action: `requireAdmin()` redirects a
 * non-admin, and the write itself uses the *user's* Supabase session, so RLS
 * independently rejects anything that slips past. The service-role client is
 * used only for `secure_settings`, which no other role can reach.
 */

export type ActionResult = { ok: boolean; error?: string; message?: string };

/** Content changes can affect any page, so drop the whole route cache. */
function revalidateSite(): void {
  revalidatePath("/", "layout");
}

/** FormData is all strings — coerce each value to what its column expects. */
function coerce(field: Field, form: FormData, row: Record<string, unknown>): unknown {
  const raw = form.get(field.name);
  const value = typeof raw === "string" ? raw.trim() : "";

  switch (field.type) {
    case "boolean":
      // An unchecked checkbox submits nothing at all.
      return form.get(field.name) !== null;

    case "number":
      return value === "" ? null : Number(value);

    case "date":
    case "datetime":
      return value === "" ? null : value;

    case "media":
      return value === "" ? null : value;

    case "tags":
      return value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

    case "slug": {
      if (value) return slugify(value);
      const source = field.from ? String(row[field.from] ?? "") : "";
      return slugify(source) || `item-${Date.now()}`;
    }

    default:
      return value;
  }
}

export async function saveResource(
  resourceKey: string,
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const resource = findResource(resourceKey);
  if (!resource) return { ok: false, error: "Unknown content type" };

  // Two passes: plain fields first, so a `slug` field can derive from a
  // value set earlier in the same submission.
  const row: Record<string, unknown> = {};
  for (const field of resource.fields) {
    if (field.type !== "slug") row[field.name] = coerce(field, formData, row);
  }
  for (const field of resource.fields) {
    if (field.type === "slug") row[field.name] = coerce(field, formData, row);
  }

  for (const field of resource.fields) {
    if (field.required && !row[field.name] && row[field.name] !== false) {
      return { ok: false, error: `${field.label} is required.` };
    }
  }

  const supabase = await createClient();

  const { error } =
    id === "new"
      ? await supabase.from(resource.table).insert(row)
      : await supabase.from(resource.table).update(row).eq("id", id);

  if (error) {
    // Unique violation on slug is the one users hit in practice.
    if (error.code === "23505") {
      return { ok: false, error: "That web address is already used by another entry." };
    }
    return { ok: false, error: error.message };
  }

  revalidateSite();
  redirect(`/admin/${resourceKey}?saved=1`);
}

/**
 * `useActionState` wrapper. The resource key and row id travel as hidden
 * inputs so the form does not need a bound closure per row.
 */
export async function saveResourceAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return saveResource(
    String(formData.get("__resource") ?? ""),
    String(formData.get("__id") ?? "new"),
    formData,
  );
}

export async function deleteResourceAction(
  _previous: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  return deleteResource(
    String(formData.get("__resource") ?? ""),
    String(formData.get("__id") ?? ""),
  );
}

export async function deleteResource(resourceKey: string, id: string): Promise<ActionResult> {
  await requireAdmin();

  const resource = findResource(resourceKey);
  if (!resource) return { ok: false, error: "Unknown content type" };

  const supabase = await createClient();
  const { error } = await supabase.from(resource.table).delete().eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidateSite();
  redirect(`/admin/${resourceKey}?deleted=1`);
}

// ---------------------------------------------------------------------
// Enquiries
// ---------------------------------------------------------------------

export async function updateEnquiry(id: string, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const status = String(formData.get("status") ?? "new");
  const admin_note = String(formData.get("admin_note") ?? "").trim();

  const allowed = ["new", "contacted", "confirmed", "closed"];
  if (!allowed.includes(status)) return { ok: false, error: "Invalid status" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("enquiries")
    .update({ status, admin_note: admin_note || null })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/enquiries");
  return { ok: true, message: "Enquiry updated." };
}

export async function deleteEnquiry(id: string): Promise<ActionResult> {
  await requireAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("enquiries").delete().eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/enquiries");
  return { ok: true };
}

// ---------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------

/**
 * Repeated form fields → a Postgres text[].
 *
 * `ListField` submits one input per value under the same name, so read them
 * all. Each value is still split on newlines (and, when `separators` is
 * given, on commas/semicolons/slashes) so a multi-value paste that slipped
 * through the client is cleaned up here too. Blanks are dropped, and
 * duplicates are collapsed.
 */
function lines(form: FormData, name: string, separators?: RegExp): string[] {
  const raw = form.getAll(name).map((value) => String(value));

  const parts = raw.flatMap((value) =>
    value.split(separators ?? /\n+/).map((piece) => piece.trim()),
  );

  return [...new Set(parts.filter(Boolean))];
}

export async function saveSettings(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const socials: Record<string, string> = {};
  for (const network of [
    "facebook",
    "instagram",
    "twitter",
    "youtube",
    "linkedin",
    "tripadvisor",
  ]) {
    const value = String(formData.get(`social_${network}`) ?? "").trim();
    if (value) socials[network] = value;
  }

  const row = {
    brand_name: String(formData.get("brand_name") ?? "").trim(),
    legal_name: String(formData.get("legal_name") ?? "").trim(),
    tagline: String(formData.get("tagline") ?? "").trim(),
    intro: String(formData.get("intro") ?? "").trim(),
    address_lines: lines(formData, "address_lines"),
    phones: lines(formData, "phones", /[\n,;/]+/),
    emails: lines(formData, "emails", /[\n,;\s]+/),
    whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
    map_url: String(formData.get("map_url") ?? "").trim() || null,
    map_embed_url: String(formData.get("map_embed_url") ?? "").trim() || null,
    hero_media_id: String(formData.get("hero_media_id") ?? "").trim() || null,
    logo_media_id: String(formData.get("logo_media_id") ?? "").trim() || null,
    booking_note: String(formData.get("booking_note") ?? "").trim() || null,
    copyright_text: String(formData.get("copyright_text") ?? "").trim(),
    socials,
  };

  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").update(row).eq("id", true);

  if (error) return { ok: false, error: error.message };

  revalidateSite();
  return { ok: true, message: "Settings saved." };
}

export async function saveMailSettings(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      error:
        "SUPABASE_SERVICE_ROLE_KEY is not set on the server, so mail settings cannot be stored.",
    };
  }

  const password = String(formData.get("smtp_password") ?? "");

  const row: Record<string, unknown> = {
    smtp_host: String(formData.get("smtp_host") ?? "").trim() || null,
    smtp_port: Number(formData.get("smtp_port") ?? 587) || 587,
    smtp_secure: formData.get("smtp_secure") !== null,
    smtp_user: String(formData.get("smtp_user") ?? "").trim() || null,
    from_name: String(formData.get("from_name") ?? "").trim() || null,
    from_email: String(formData.get("from_email") ?? "").trim() || null,
    reply_to: String(formData.get("reply_to") ?? "").trim() || null,
    notify_emails: lines(formData, "notify_emails", /[\n,;\s]+/),
  };

  // The stored password is never rendered back into the form, so an empty
  // field means "leave it as it is" rather than "clear it".
  if (password) row.smtp_password = password;

  // secure_settings has no RLS policies — only the service role can write it.
  const supabase = createAdminClient();
  const { error } = await supabase.from("secure_settings").update(row).eq("id", true);

  if (error) return { ok: false, error: error.message };

  return { ok: true, message: "Mail settings saved." };
}

export async function testMail(): Promise<ActionResult> {
  await requireAdmin();

  const result = await sendTestEmail();
  return result.sent
    ? { ok: true, message: "Test email sent — check the inbox." }
    : { ok: false, error: result.error ?? "Could not send." };
}
