"use client";

import { useActionState, useState, useTransition } from "react";

import { saveMailSettings, testMail, type ActionResult } from "@/app/admin/actions";

/**
 * SMTP configuration.
 *
 * The stored password is never sent to the browser — the server only ever
 * reports whether one is set. Submitting an empty password field therefore
 * means "keep the existing one".
 */
export function MailForm({
  settings,
  hasPassword,
}: {
  settings: {
    smtp_host: string | null;
    smtp_port: number | null;
    smtp_secure: boolean;
    smtp_user: string | null;
    from_name: string | null;
    from_email: string | null;
    reply_to: string | null;
    notify_emails: string[];
  } | null;
  hasPassword: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (previous, formData) => saveMailSettings(formData),
    null,
  );

  const [testing, startTest] = useTransition();
  const [testResult, setTestResult] = useState<ActionResult | null>(null);

  return (
    <>
      <form action={formAction} className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="smtp_host" className="field-label">
              SMTP host
            </label>
            <input
              id="smtp_host"
              name="smtp_host"
              defaultValue={settings?.smtp_host ?? ""}
              placeholder="smtp.gmail.com"
              className="field bg-paper"
            />
          </div>

          <div>
            <label htmlFor="smtp_port" className="field-label">
              Port
            </label>
            <input
              id="smtp_port"
              name="smtp_port"
              type="number"
              defaultValue={settings?.smtp_port ?? 587}
              className="field bg-paper"
            />
            <p className="mt-1.5 text-xs text-stone">587 for STARTTLS, 465 for SSL.</p>
          </div>

          <div>
            <label htmlFor="smtp_user" className="field-label">
              SMTP username
            </label>
            <input
              id="smtp_user"
              name="smtp_user"
              autoComplete="off"
              defaultValue={settings?.smtp_user ?? ""}
              className="field bg-paper"
            />
          </div>

          <div>
            <label htmlFor="smtp_password" className="field-label">
              SMTP password
            </label>
            <input
              id="smtp_password"
              name="smtp_password"
              type="password"
              autoComplete="new-password"
              placeholder={hasPassword ? "•••••••• (unchanged)" : ""}
              className="field bg-paper"
            />
            <p className="mt-1.5 text-xs text-stone">
              {hasPassword
                ? "Leave blank to keep the saved password."
                : "For Gmail, use an app password, not your account password."}
            </p>
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-start gap-3 border border-paper-edge bg-paper p-4">
              <input
                id="smtp_secure"
                name="smtp_secure"
                type="checkbox"
                defaultChecked={settings?.smtp_secure ?? false}
                className="mt-1 h-4 w-4 accent-[#157a4c]"
              />
              <label htmlFor="smtp_secure" className="text-sm">
                Use implicit TLS
                <span className="block text-xs text-stone">
                  Tick only for port 465. Port 587 upgrades automatically.
                </span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="from_name" className="field-label">
              From name
            </label>
            <input
              id="from_name"
              name="from_name"
              defaultValue={settings?.from_name ?? "Misty Meadows Resorts"}
              className="field bg-paper"
            />
          </div>

          <div>
            <label htmlFor="from_email" className="field-label">
              From address
            </label>
            <input
              id="from_email"
              name="from_email"
              type="email"
              defaultValue={settings?.from_email ?? ""}
              placeholder="info@mistymeadowsresorts.com"
              className="field bg-paper"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="notify_emails" className="field-label">
              Send enquiry notifications to
            </label>
            <textarea
              id="notify_emails"
              name="notify_emails"
              rows={3}
              defaultValue={(settings?.notify_emails ?? []).join("\n")}
              placeholder="info@mistymeadowsresorts.com"
              className="field resize-y bg-paper"
            />
            <p className="mt-1.5 text-xs text-stone">
              One address per line. Every website enquiry is emailed to these.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="reply_to" className="field-label">
              Fallback reply-to
            </label>
            <input
              id="reply_to"
              name="reply_to"
              type="email"
              defaultValue={settings?.reply_to ?? ""}
              className="field bg-paper"
            />
            <p className="mt-1.5 text-xs text-stone">
              Used only if a guest leaves no email. Normally you can just hit
              Reply to reach them.
            </p>
          </div>
        </div>

        {state?.error ? (
          <p role="alert" className="border-l-2 border-burgundy bg-paper p-4 text-sm text-burgundy">
            {state.error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" className="btn btn-solid" disabled={pending}>
            {pending ? "Saving…" : "Save email settings"}
          </button>
          {state?.message ? (
            <span role="status" className="text-sm text-green">
              {state.message}
            </span>
          ) : null}
        </div>
      </form>

      <div className="mt-6 border-t border-paper-edge pt-6">
        <button
          type="button"
          className="btn btn-outline"
          disabled={testing}
          onClick={() =>
            startTest(async () => {
              setTestResult(await testMail());
            })
          }
        >
          {testing ? "Sending…" : "Send test email"}
        </button>

        {testResult ? (
          <p
            role="status"
            className={`mt-3 text-sm ${testResult.ok ? "text-green" : "text-burgundy"}`}
          >
            {testResult.message ?? testResult.error}
          </p>
        ) : (
          <p className="mt-3 text-xs text-stone">
            Save your settings first, then send yourself a test to confirm they work.
          </p>
        )}
      </div>
    </>
  );
}
