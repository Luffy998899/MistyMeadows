"use client";

import { useActionState } from "react";

import { saveSettings, type ActionResult } from "@/app/admin/actions";
import type { Media, SiteSettings } from "@/lib/types";

import { MediaPicker } from "./MediaPicker";

const SOCIAL_NETWORKS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "twitter", label: "X (Twitter)" },
  { key: "youtube", label: "YouTube" },
  { key: "tripadvisor", label: "Tripadvisor" },
  { key: "linkedin", label: "LinkedIn" },
] as const;

function Text({
  name,
  label,
  defaultValue,
  help,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  help?: string;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        className="field bg-paper"
      />
      {help ? <p className="mt-1.5 text-xs text-stone">{help}</p> : null}
    </div>
  );
}

function Lines({
  name,
  label,
  values,
  help,
  rows = 3,
}: {
  name: string;
  label: string;
  values: string[];
  help?: string;
  rows?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={values.join("\n")}
        className="field resize-y bg-paper"
      />
      <p className="mt-1.5 text-xs text-stone">{help ?? "One per line."}</p>
    </div>
  );
}

export function SettingsForm({
  settings,
  heroMedia,
  logoMedia,
}: {
  settings: SiteSettings;
  heroMedia: Media | null;
  logoMedia: Media | null;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (previous, formData) => saveSettings(formData),
    null,
  );

  return (
    <form action={formAction} className="mt-6 space-y-10">
      <fieldset>
        <legend className="eyebrow mb-4">Identity</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Text name="brand_name" label="Brand name" defaultValue={settings.brand_name} />
          <Text name="legal_name" label="Legal name" defaultValue={settings.legal_name} />
          <div className="sm:col-span-2">
            <Text name="tagline" label="Tagline" defaultValue={settings.tagline} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="intro" className="field-label">
              About the resort
            </label>
            <textarea
              id="intro"
              name="intro"
              rows={6}
              defaultValue={settings.intro}
              className="field resize-y bg-paper"
            />
            <p className="mt-1.5 text-xs text-stone">
              Shown on the home page and about page, and trimmed for the footer.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Text
              name="copyright_text"
              label="Copyright line"
              defaultValue={settings.copyright_text}
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-4">Images</legend>
        <div className="space-y-5">
          <MediaPicker
            name="logo_media_id"
            label="Logo"
            initial={logoMedia}
            help="Upload the official logo file to replace the drawn mark in the header."
          />
          <MediaPicker
            name="hero_media_id"
            label="Home page hero image"
            initial={heroMedia}
            help="A wide photograph of the property or the valley works best."
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-4">Contact</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Lines name="phones" label="Phone numbers" values={settings.phones} />
          <Lines name="emails" label="Email addresses" values={settings.emails} />
          <div className="sm:col-span-2">
            <Lines
              name="address_lines"
              label="Address"
              values={settings.address_lines}
              help="One line per row, as you want it printed."
            />
          </div>
          <Text
            name="whatsapp"
            label="WhatsApp number"
            defaultValue={settings.whatsapp}
            help="With country code, no spaces."
          />
          <Text name="map_url" label="Google Maps link" defaultValue={settings.map_url} />
          <div className="sm:col-span-2">
            <Text
              name="map_embed_url"
              label="Google Maps embed URL"
              defaultValue={settings.map_embed_url}
              help="The src from Google Maps → Share → Embed a map. Shows an inline map on the about page."
            />
          </div>
          <div className="sm:col-span-2">
            <Text
              name="booking_note"
              label="Booking-direct note"
              defaultValue={settings.booking_note}
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-4">Social media</legend>
        <p className="mb-4 text-xs text-stone">
          Paste the full link to each profile. Leave blank to hide that icon.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          {SOCIAL_NETWORKS.map((network) => (
            <Text
              key={network.key}
              name={`social_${network.key}`}
              label={network.label}
              defaultValue={settings.socials[network.key] ?? ""}
            />
          ))}
        </div>
      </fieldset>

      {state?.error ? (
        <p role="alert" className="border-l-2 border-wine bg-paper p-4 text-sm text-wine">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-4">
        <button type="submit" className="btn btn-solid" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
        {state?.message ? (
          <span role="status" className="text-sm text-wine">
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
