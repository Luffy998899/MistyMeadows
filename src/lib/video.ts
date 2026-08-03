/**
 * Turns a YouTube or Vimeo link into an embeddable one.
 *
 * The owner pastes whatever the address bar or the share button gave them,
 * so all the usual shapes are accepted. Anything unrecognised returns null
 * and the caller falls back to a plain link rather than putting an arbitrary
 * URL inside an iframe.
 */
export function embedUrlFor(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const id = url.searchParams.get("v") ?? url.pathname.match(/\/(?:embed|shorts|v)\/([^/?]+)/)?.[1];
    return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).pop();
    return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
  }

  return null;
}
