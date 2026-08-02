import { cache } from "react";

import {
  DEMO_APARTMENTS,
  DEMO_ATTRACTIONS,
  DEMO_DINING,
  DEMO_FACILITIES,
  DEMO_GALLERY,
  DEMO_ROOMS,
  DEMO_SETTINGS,
  DEMO_TESTIMONIALS,
} from "./fallback-content";
import { isSupabaseConfigured } from "./supabase/env";
import { createClient } from "./supabase/server";
import type {
  Apartment,
  Attraction,
  DiningItem,
  Facility,
  GalleryItem,
  Offer,
  Post,
  Room,
  SiteSettings,
  Testimonial,
} from "./types";

/**
 * Read side of the site.
 *
 * Two deliberate behaviours:
 *
 *  - No Supabase env vars → "demo mode": serve the fixtures in
 *    `fallback-content.ts` so the site is reviewable before a database
 *    exists. `isDemoMode()` lets the UI say so.
 *  - Supabase configured but a query fails → log loudly and return an empty
 *    list. Sections render nothing rather than showing stale fixtures, so a
 *    real outage stays visible instead of being papered over.
 *
 * Settings are the one exception: header and footer must always render, so a
 * failed settings read falls back to the fixture.
 */

export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}

function report(what: string, error: { message: string }): void {
  console.error(`[content] failed to load ${what}: ${error.message}`);
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  if (isDemoMode()) return DEMO_SETTINGS;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("*, hero_media:hero_media_id(*), logo_media:logo_media_id(*)")
      .maybeSingle();

    if (error) {
      report("site settings", error);
      return DEMO_SETTINGS;
    }
    if (!data) return DEMO_SETTINGS;

    // Merge over the fixture so a half-filled settings row still renders.
    return { ...DEMO_SETTINGS, ...(data as Partial<SiteSettings>) } as SiteSettings;
  } catch (error) {
    report("site settings", error as Error);
    return DEMO_SETTINGS;
  }
});

/** Shared shape for the simple "published rows, in order" reads. */
async function listPublished<T>(table: string, select: string, demo: T[]): Promise<T[]> {
  if (isDemoMode()) return demo;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      report(table, error);
      return [];
    }
    return (data ?? []) as T[];
  } catch (error) {
    report(table, error as Error);
    return [];
  }
}

export const getRooms = cache(
  (): Promise<Room[]> => listPublished("rooms", "*, image:image_id(*)", DEMO_ROOMS),
);

export const getApartments = cache(
  (): Promise<Apartment[]> =>
    listPublished("apartments", "*, image:image_id(*)", DEMO_APARTMENTS),
);

export const getAttractions = cache(
  (): Promise<Attraction[]> =>
    listPublished("attractions", "*, image:image_id(*)", DEMO_ATTRACTIONS),
);

export const getFacilities = cache(
  (): Promise<Facility[]> => listPublished("facilities", "*", DEMO_FACILITIES),
);

export const getDining = cache(
  (): Promise<DiningItem[]> =>
    listPublished("dining_items", "*, image:image_id(*)", DEMO_DINING),
);

export const getTestimonials = cache(
  (): Promise<Testimonial[]> => listPublished("testimonials", "*", DEMO_TESTIMONIALS),
);

export const getGallery = cache(
  (): Promise<GalleryItem[]> =>
    listPublished("gallery_items", "*, media:media_id(*)", DEMO_GALLERY),
);

export const getOffers = cache(
  (): Promise<Offer[]> => listPublished("offers", "*, image:image_id(*)", []),
);

export const getRoom = cache(async (slug: string): Promise<Room | null> => {
  if (isDemoMode()) return DEMO_ROOMS.find((r) => r.slug === slug) ?? null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("rooms")
      .select("*, image:image_id(*)")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error) {
      report(`room "${slug}"`, error);
      return null;
    }
    return (data as Room) ?? null;
  } catch (error) {
    report(`room "${slug}"`, error as Error);
    return null;
  }
});

export const getPosts = cache(async (limit?: number): Promise<Post[]> => {
  if (isDemoMode()) return [];

  try {
    const supabase = await createClient();
    let query = supabase
      .from("posts")
      .select("*, image:image_id(*)")
      .eq("published", true)
      .order("published_at", { ascending: false, nullsFirst: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      report("posts", error);
      return [];
    }
    return (data ?? []) as Post[];
  } catch (error) {
    report("posts", error as Error);
    return [];
  }
});

export const getPost = cache(async (slug: string): Promise<Post | null> => {
  if (isDemoMode()) return null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("posts")
      .select("*, image:image_id(*)")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    if (error) {
      report(`post "${slug}"`, error);
      return null;
    }
    return (data as Post) ?? null;
  } catch (error) {
    report(`post "${slug}"`, error as Error);
    return null;
  }
});
