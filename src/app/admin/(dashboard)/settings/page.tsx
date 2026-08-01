import { MailForm } from "@/components/admin/MailForm";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getMailSettings } from "@/lib/mail";
import { createClient } from "@/lib/supabase/server";
import type { Media, SiteSettings } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: settingsRow } = await supabase
    .from("site_settings")
    .select("*")
    .maybeSingle();

  const settings = (settingsRow ?? {}) as SiteSettings;

  // Resolve the two media references for the pickers.
  const ids = [settings.hero_media_id, settings.logo_media_id].filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  );

  const mediaById = new Map<string, Media>();
  if (ids.length > 0) {
    const { data } = await supabase.from("media").select("*").in("id", ids);
    for (const item of (data ?? []) as Media[]) mediaById.set(item.id, item);
  }

  const mail = await getMailSettings();

  return (
    <>
      <h1 className="text-h2">Settings</h1>
      <p className="mt-2 text-sm text-stone">
        Contact details, social links and images used across the website.
      </p>

      <SettingsForm
        settings={{
          ...settings,
          address_lines: settings.address_lines ?? [],
          phones: settings.phones ?? [],
          emails: settings.emails ?? [],
          socials: settings.socials ?? {},
        }}
        heroMedia={
          settings.hero_media_id ? (mediaById.get(settings.hero_media_id) ?? null) : null
        }
        logoMedia={
          settings.logo_media_id ? (mediaById.get(settings.logo_media_id) ?? null) : null
        }
      />

      <section id="mail" className="mt-16 scroll-mt-8 border-t border-paper-edge pt-10">
        <h2 className="text-h2">Email</h2>
        <p className="mt-2 max-w-prose text-sm text-stone">
          Where website enquiries are sent. Enquiries are always saved and
          listed under Enquiries — this is only about being notified by email.
        </p>

        {/*
          Only a boolean about the password crosses to the client; the value
          itself never leaves the server.
        */}
        <MailForm
          settings={
            mail
              ? {
                  smtp_host: mail.smtp_host,
                  smtp_port: mail.smtp_port,
                  smtp_secure: mail.smtp_secure,
                  smtp_user: mail.smtp_user,
                  from_name: mail.from_name,
                  from_email: mail.from_email,
                  reply_to: mail.reply_to,
                  notify_emails: mail.notify_emails ?? [],
                }
              : null
          }
          hasPassword={Boolean(mail?.smtp_password)}
        />

        {!process.env.SUPABASE_SERVICE_ROLE_KEY ? (
          <p className="mt-6 border-l-2 border-bark bg-paper p-4 text-sm text-bark">
            SUPABASE_SERVICE_ROLE_KEY is not set on the server, so email
            settings cannot be read or saved. Add it to your environment and
            restart.
          </p>
        ) : null}
      </section>
    </>
  );
}
