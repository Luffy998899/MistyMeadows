import "server-only";

import nodemailer from "nodemailer";
import { Resend } from "resend";

import { createAdminClient } from "./supabase/admin";
import { isSupabaseConfigured } from "./supabase/env";
import type { Enquiry, MailSettings } from "./types";

/**
 * Outbound mail.
 *
 * Two ways to send, tried in this order:
 *
 *  1. **Resend**, when `RESEND_API_KEY` is set. An API key rather than SMTP
 *     credentials, so there is nothing in the database to leak, and it is
 *     what this site is deployed with.
 *  2. **SMTP**, from `secure_settings`, which the owner fills in at
 *     /admin/settings — no redeploy, no env var. That table has RLS on and
 *     no policies, so only the service-role client below can read it.
 *
 * Addresses come from `secure_settings` either way, so the owner can change
 * who gets notified without touching the deployment. Where nothing is set,
 * enquiries go to the resort's published address.
 */

/** Where enquiries go when the admin panel has not been told otherwise. */
const DEFAULT_NOTIFY = "info@mistymeadowsresorts.com";

/**
 * Resend will only send from a domain verified on the account, so there is
 * no safe hardcoded default here — an unverified `from` is rejected at the
 * API rather than silently dropped, which is the behaviour we want.
 */
function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  return key ? new Resend(key) : null;
}

function notifyList(settings: MailSettings | null): string[] {
  const configured = settings?.notify_emails?.filter((address) => address?.trim());
  if (configured && configured.length > 0) return configured;

  const fromEnv = process.env.MAIL_TO?.split(",").map((a) => a.trim()).filter(Boolean);
  if (fromEnv && fromEnv.length > 0) return fromEnv;

  return [DEFAULT_NOTIFY];
}

function fromAddress(settings: MailSettings | null): string | null {
  const address = settings?.from_email?.trim() || process.env.MAIL_FROM?.trim();
  if (!address) return null;
  const name = settings?.from_name?.trim() || "Misty Meadows Resorts";
  return `${name} <${address}>`;
}

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

/** True when SMTP alone could send — i.e. without Resend in the picture. */
export function isSmtpConfigured(settings: MailSettings | null): settings is MailSettings {
  return Boolean(settings?.smtp_host && settings.smtp_port && settings.from_email);
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

/** Whether an enquiry notification can actually be delivered right now. */
export function isMailConfigured(settings: MailSettings | null): boolean {
  if (isResendConfigured()) return Boolean(fromAddress(settings));
  return isSmtpConfigured(settings);
}

/** Which transport a send would use, for the admin panel to display. */
export function mailProvider(settings: MailSettings | null): "resend" | "smtp" | null {
  if (isResendConfigured() && fromAddress(settings)) return "resend";
  if (isSmtpConfigured(settings)) return "smtp";
  return null;
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
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#3e362e">
      <p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#6b5a47;margin:0 0 4px">
        Misty Meadows Resorts
      </p>
      <h1 style="font-size:22px;font-weight:400;margin:0 0 20px">New booking enquiry</h1>
      <table style="width:100%;border-collapse:collapse;font-family:Helvetica,Arial,sans-serif;font-size:14px">
        ${rows
          .map(
            ([k, v]) => `<tr>
              <td style="padding:8px 0;color:#6b5a47;width:110px;border-bottom:1px solid #ebe0d3">${k}</td>
              <td style="padding:8px 0;border-bottom:1px solid #ebe0d3">${escapeHtml(v)}</td>
            </tr>`,
          )
          .join("")}
      </table>
      ${
        enquiry.message
          ? `<p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;margin:20px 0 0;
                 padding:14px;background:#f4ede4;white-space:pre-wrap">${escapeHtml(enquiry.message)}</p>`
          : ""
      }
    </div>`;

  return { text, html };
}

export type MailResult = { sent: boolean; error?: string };

type Message = {
  to: string[];
  from: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * One send, over whichever transport is configured.
 *
 * Never throws: an enquiry is written to the database before this is called,
 * and a mail outage must not lose it or fail the guest's submission. The
 * reason is returned instead, and recorded against the enquiry so the
 * failure is visible in the admin inbox rather than silent.
 */
async function deliver(settings: MailSettings | null, message: Message): Promise<MailResult> {
  const resend = resendClient();

  if (resend) {
    try {
      const { error } = await resend.emails.send({
        from: message.from,
        to: message.to,
        replyTo: message.replyTo,
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
      });

      // The SDK reports failures in the payload rather than by throwing, so
      // this branch is the one that actually catches a rejected send.
      if (error) {
        const detail = `${error.name}: ${error.message}`;
        console.error(`[mail] resend rejected the message — ${detail}`);
        return { sent: false, error: detail };
      }
      return { sent: true };
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown Resend error";
      console.error(`[mail] resend request failed — ${detail}`);
      return { sent: false, error: detail };
    }
  }

  if (!isSmtpConfigured(settings)) {
    return {
      sent: false,
      error: "No mail transport configured — set RESEND_API_KEY, or fill in SMTP under Settings.",
    };
  }

  try {
    await transportFor(settings).sendMail({
      from: message.from,
      to: message.to.join(", "),
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return { sent: true };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown mail error";
    console.error(`[mail] smtp send failed — ${detail}`);
    return { sent: false, error: detail };
  }
}

/** Emails the owner. Never throws — the enquiry is already saved either way. */
export async function sendEnquiryNotification(enquiry: EnquiryPayload): Promise<MailResult> {
  const settings = await getMailSettings();
  const from = fromAddress(settings);

  if (!from) {
    return {
      sent: false,
      error:
        "No sending address set. Add MAIL_FROM (a address on a domain verified with Resend), " +
        "or fill in the from address under Settings → Email.",
    };
  }

  const { text, html } = renderEnquiry(enquiry);

  return deliver(settings, {
    to: notifyList(settings),
    from,
    // So the owner can hit Reply and reach the guest directly.
    replyTo: enquiry.email || settings?.reply_to || undefined,
    subject: `New enquiry — ${enquiry.name}${enquiry.room_name ? ` · ${enquiry.room_name}` : ""}`,
    text,
    html,
  });
}

/** Used by the "Send test email" button on /admin/settings. */
export async function sendTestEmail(): Promise<MailResult> {
  const settings = await getMailSettings();
  const from = fromAddress(settings);

  if (!from) {
    return {
      sent: false,
      error:
        "Set a from address first — under Settings → Email, or as MAIL_FROM. With Resend it " +
        "must be on a domain verified with your Resend account.",
    };
  }

  const to = notifyList(settings);

  return deliver(settings, {
    to,
    from,
    subject: "Misty Meadows — test email",
    text:
      `This is a test from your website admin panel, sent via ` +
      `${mailProvider(settings) === "resend" ? "Resend" : "SMTP"}. ` +
      `If you are reading this, enquiry notifications will reach ${to.join(", ")}.`,
  });
}
