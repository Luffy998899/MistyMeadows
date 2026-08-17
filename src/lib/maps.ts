import type { SiteSettings } from "./types";

/**
 * Builds the src for the embedded map.
 *
 * People paste all sorts of things into the "embed URL" box — the whole
 * `<iframe …>` snippet Google hands out, a shortened share link, a plain
 * maps URL, or nothing at all. An unvalidated value goes straight into the
 * iframe, and anything that is not an absolute off-site URL resolves against
 * our own origin and renders this site's 404 page inside the frame.
 *
 * So: pull the src out of a pasted iframe, accept only Google Maps hosts,
 * and otherwise derive a working embed from the postal address. The map is
 * therefore correct by default and cannot be broken by a bad paste.
 */

const ALLOWED_HOSTS = [
  "www.google.com",
  "google.com",
  "maps.google.com",
  "www.google.co.in",
  "google.co.in",
];

/** Extracts the src when someone pastes the whole <iframe> tag. */
function unwrapIframe(value: string): string {
  const match = value.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  return match ? match[1] : value;
}

function isUsableEmbed(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    if (!ALLOWED_HOSTS.includes(url.hostname)) return false;
    // /maps/embed is the canonical form; ?output=embed also renders.
    return url.pathname.startsWith("/maps") || url.searchParams.get("output") === "embed";
  } catch {
    // Not an absolute URL — a relative value here is what produced the 404.
    return false;
  }
}

/** A query-based embed. Needs no API key and always resolves to something. */
function fromQuery(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

export function mapEmbedSrc(settings: SiteSettings): string {
  const configured = settings.map_embed_url?.trim();

  if (configured) {
    const candidate = unwrapIframe(configured).trim();
    if (isUsableEmbed(candidate)) return candidate;
    // Fall through rather than rendering a broken frame.
  }

  const address = settings.address_lines.filter(Boolean).join(", ");
  return fromQuery(address || settings.brand_name);
}

/** The "open in Google Maps" link, derived the same way when unset. */
export function mapLinkHref(settings: SiteSettings): string {
  const configured = settings.map_url?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === "https:" || url.protocol === "http:") return configured;
    } catch {
      // ignore and derive below
    }
  }

  const address = settings.address_lines.filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address || settings.brand_name,
  )}`;
}
