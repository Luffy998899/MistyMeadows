import "server-only";

import nodemailer from "nodemailer";

import { createAdminClient } from "./supabase/admin";
import { isSupabaseConfigured } from "./supabase/env";
import type { Enquiry, MailSettings } from "./types";

/**
 * Outbound mail.
 *
 * SMTP credentials live in `secure_settings`, which the owner fills in from
 * /admin/settings — no redeploy, no env var. That table has RLS on and no
 * policies, so only the service-role client below can read it.
 */

export async function getMailSettings(): Promise<MailSettings | null> {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("secure_settings").select("*").maybeSingle();

  if (error) {
    console.error(`[mail] could not read mail settings: ${error.message}`);
    return null;
  }
  return (data as MailSettings) ?? null;
}

export function isMailConfigured(settings: MailSettings | null): settings is MailSettings {
  return Boolean(
    settings?.smtp_host && settings.smtp_port && settings.from_email &&
      settings.notify_emails.length > 0,
  );
}

function transportFor(settings: MailSettings) {
  return nodemailer.createTransport({
    host: settings.smtp_host!,
    port: settings.smtp_port!,
    // Port 465 is implicit TLS; 587 upgrades via STARTTLS.
    secure: settings.smtp_secure ?? settings.smtp_port === 465,
    auth: settings.smtp_user
      ? { user: settings.smtp_user, pass: settings.smtp_password ?? "" }
      : undefined,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type EnquiryPayload = Pick<
  Enquiry,
  "name" | "email" | "phone" | "check_in" | "check_out" | "guests" | "room_name" | "message"
>;

function renderEnquiry(enquiry: EnquiryPayload): { text: string; html: string } {
  const rows: [string, string][] = [
    ["Name", enquiry.name],
    ["Email", enquiry.email],
    ["Phone", enquiry.phone || "—"],
    ["Room", enquiry.room_name || "Not specified"],
    ["Check in", enquiry.check_in || "—"],
    ["Check out", enquiry.check_out || "—"],
    ["Guests", enquiry.guests ? String(enquiry.guests) : "—"],
  ];

  const text = [
    "New enquiry from mistymeadowsresorts.com",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "Message:",
    enquiry.message || "(none)",
  ].join("\n");

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1b1d19">
      <p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#6e6c61;margin:0 0 4px">
        Misty Meadows Resorts
      </p>
      <h1 style="font-size:22px;font-weight:400;margin:0 0 20px">New booking enquiry</h1>
      <table style="width:100%;border-collapse:collapse;font-family:Helvetica,Arial,sans-serif;font-size:14px">
        ${rows
          .map(
            ([k, v]) => `<tr>
              <td style="padding:8px 0;color:#6e6c61;width:110px;border-bottom:1px solid #ede7da">${k}</td>
              <td style="padding:8px 0;border-bottom:1px solid #ede7da">${escapeHtml(v)}</td>
            </tr>`,
          )
          .join("")}
      </table>
      ${
        enquiry.message
          ? `<p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;margin:20px 0 0;
                 padding:14px;background:#f5f2ea;white-space:pre-wrap">${escapeHtml(enquiry.message)}</p>`
          : ""
      }
    </div>`;

  return { text, html };
}

export type MailResult = { sent: boolean; error?: string };

/** Emails the owner. Never throws — the enquiry is already saved either way. */
export async function sendEnquiryNotification(enquiry: EnquiryPayload): Promise<MailResult> {
  const settings = await getMailSettings();

  if (!isMailConfigured(settings)) {
    return { sent: false, error: "SMTP is not configured in the admin panel" };
  }

  try {
    const { text, html } = renderEnquiry(enquiry);

    await transportFor(settings).sendMail({
      from: `"${settings.from_name ?? "Misty Meadows Resorts"}" <${settings.from_email}>`,
      to: settings.notify_emails.join(", "),
      // So the owner can hit Reply and reach the guest directly.
      replyTo: enquiry.email || settings.reply_to || undefined,
      subject: `New enquiry — ${enquiry.name}${enquiry.room_name ? ` · ${enquiry.room_name}` : ""}`,
      text,
      html,
    });

    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown mail error";
    console.error(`[mail] enquiry notification failed: ${message}`);
    return { sent: false, error: message };
  }
}

/** Used by the "Send test email" button on /admin/settings. */
export async function sendTestEmail(): Promise<MailResult> {
  const settings = await getMailSettings();

  if (!isMailConfigured(settings)) {
    return { sent: false, error: "Fill in SMTP host, port, from address and at least one notification address first." };
  }

  try {
    await transportFor(settings).sendMail({
      from: `"${settings.from_name ?? "Misty Meadows Resorts"}" <${settings.from_email}>`,
      to: settings.notify_emails.join(", "),
      subject: "Misty Meadows — test email",
      text: "This is a test from your website admin panel. If you are reading this, enquiry notifications will reach you.",
    });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown mail error";
    return { sent: false, error: message };
  }
}
