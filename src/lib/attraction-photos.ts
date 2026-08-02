import "server-only";

import fs from "node:fs";
import path from "node:path";

import { cache } from "react";

import type { Media } from "./types";

/**
 * Photographs of the attractions, dropped into `public/media/attractions/`.
 *
 * These are public landmarks rather than the resort's property, so nothing
 * is committed for them. There are two ways to fill them in, and the page
 * prefers them in this order:
 *
 *   1. an upload attached to the row in /admin — always wins;
 *   2. a file named `<slug>.jpg` in `public/media/attractions/`, which is
 *      what `scripts/fetch-attraction-photos.mjs` writes;
 *   3. otherwise the labelled placeholder plate.
 *
 * Files fetched by that script are freely licensed but nearly all of them
 * require attribution, so it also writes `credits.json` beside them —
 * `{ "<slug>": { author, licence, source } }` — and anything listed there
 * gets a credit line rendered under the photograph. A photo with no credit
 * entry is assumed to be the resort's own.
 *
 * The directory is read once per render pass and the result is cached. It
 * is read at build time for a statically rendered page, so adding files
 * means rebuilding — which is the same step as deploying them anyway.
 */

export type PhotoCredit = {
  author?: string;
  licence?: string;
  source?: string;
};

const DIR = path.join(process.cwd(), "public", "media", "attractions");

type Loaded = {
  photos: Record<string, Media>;
  credits: Record<string, PhotoCredit>;
};

export const loadAttractionPhotos = cache((): Loaded => {
  const empty: Loaded = { photos: {}, credits: {} };

  let entries: string[];
  try {
    entries = fs.readdirSync(DIR);
  } catch {
    // No directory yet — the normal state of a fresh clone.
    return empty;
  }

  let credits: Record<string, PhotoCredit> = {};
  try {
    const raw = fs.readFileSync(path.join(DIR, "credits.json"), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      credits = parsed as Record<string, PhotoCredit>;
    }
  } catch {
    // Credits are optional: own photographs do not need one.
  }

  const photos: Record<string, Media> = {};
  for (const file of entries) {
    const ext = path.extname(file).toLowerCase();
    if (![".jpg", ".jpeg", ".png", ".webp", ".avif"].includes(ext)) continue;

    const slug = path.basename(file, ext);
    photos[slug] = {
      id: `attraction-photo:${slug}`,
      storage_path: `/media/attractions/${file}`,
      public_url: `/media/attractions/${file}`,
      kind: "image",
      // Overwritten by the caller, which knows the attraction's name.
      alt: slug.replace(/-/g, " "),
      title: null,
      width: null,
      height: null,
      size_bytes: null,
      created_at: "2024-01-01T00:00:00.000Z",
    };
  }

  return { photos, credits };
});
