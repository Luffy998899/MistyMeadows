import type { Media } from "./types";

/**
 * The resort's own photography, shipped with the repository.
 *
 * Everything here lives in `public/media/`, so the site has real pictures
 * from the first `npm run dev` — no database, no uploads, no placeholder
 * plates. The admin panel still owns the live site: `supabase/seed.sql`
 * inserts a `media` row for each of these pointing at the same path, so the
 * owner can re-point any slot at an upload of their own without a developer.
 *
 * The keys are slots, not file names. Sections ask for `IMAGES.heroSlides`
 * or `IMAGES.welcome`, and swapping which photograph fills a slot is a
 * one-line change here rather than an edit in six components.
 */

type Slot = {
  /** Path under `public/`. Also the seeded `storage_path`. */
  file: string;
  alt: string;
  width: number;
  height: number;
};

const SLOTS = {
  // ---- Hero slider ---------------------------------------------------
  heroValley: {
    file: "/media/slider-valley-bloom.jpg",
    alt: "Bougainvillea in flower above a pine valley at Misty Meadows",
    width: 1920,
    height: 1080,
  },
  heroPines: {
    file: "/media/slider-pine-slopes.jpg",
    alt: "Chir pine covering the slopes below the resort",
    width: 1920,
    height: 1080,
  },
  heroFront: {
    file: "/media/slider-resort-front.jpg",
    alt: "The entrance forecourt at Misty Meadows Resorts in full sun",
    width: 1920,
    height: 1080,
  },
  heroHillside: {
    file: "/media/slider-resort-hillside.jpg",
    alt: "Misty Meadows seen from across the valley, set into the hillside",
    width: 1920,
    height: 1080,
  },

  // ---- Bands ---------------------------------------------------------
  welcome: {
    file: "/media/welcome-misty-terrace.jpg",
    alt: "Cloud rolling through the pines above the resort's stone terrace",
    width: 640,
    height: 500,
  },
  panorama: {
    file: "/media/panorama-entrance.jpg",
    alt: "Panorama across the resort entrance, gardens and stone carving",
    width: 1920,
    height: 700,
  },
  celebrations: {
    file: "/media/celebrations-terrace.jpg",
    alt: "The open terrace laid for dinner at dusk, lights along the steps",
    width: 730,
    height: 705,
  },
  terraceValley: {
    file: "/media/terrace-valley-view.jpg",
    alt: "A table for two on a private terrace looking down the valley",
    width: 2000,
    height: 1333,
  },

  // ---- Dining --------------------------------------------------------
  restaurantHall: {
    file: "/media/restaurant-hall.jpg",
    alt: "The multi-cuisine restaurant, laid up and lit by the valley windows",
    width: 2000,
    height: 1333,
  },
  restaurantTable: {
    file: "/media/restaurant-table.jpg",
    alt: "A restaurant table set with red napkins and a small succulent",
    width: 2000,
    height: 1333,
  },

  // ---- Rooms ---------------------------------------------------------
  roomLuxury: {
    file: "/media/room-luxury.jpg",
    alt: "Luxury room with a seating corner and the valley through the glazing",
    width: 730,
    height: 705,
  },
  roomTerrace: {
    file: "/media/room-terrace.jpg",
    alt: "Room opening onto a private terrace with chairs and a table",
    width: 730,
    height: 705,
  },
  roomSuperior: {
    file: "/media/room-superior.jpg",
    alt: "Superior room with a wide window onto the wooded hillside",
    width: 730,
    height: 705,
  },
  roomBalcony: {
    file: "/media/room-balcony.jpg",
    alt: "Room with full-height glazing onto a balcony above the valley",
    width: 730,
    height: 705,
  },
  suiteLounge: {
    file: "/media/suite-premium-lounge.jpg",
    alt: "Premium suite with a separate sofa lounge beside the bed",
    width: 2000,
    height: 1333,
  },
  suiteBed: {
    file: "/media/suite-premium-bed.jpg",
    alt: "Premium suite bedroom with seating and a writing desk",
    width: 2000,
    height: 1333,
  },
  roomDeluxe: {
    file: "/media/room-deluxe-desk.jpg",
    alt: "Deluxe room with a writing desk, television and mirror",
    width: 2000,
    height: 1333,
  },
  roomEvening: {
    file: "/media/room-evening.jpg",
    alt: "A room in the evening, wall lights on and the curtains drawn",
    width: 2000,
    height: 1333,
  },
  roomOutlook: {
    file: "/media/room-balcony-outlook.jpg",
    alt: "Looking from the bed through sliding doors onto a balcony",
    width: 2000,
    height: 1333,
  },
} as const satisfies Record<string, Slot>;

export type ImageSlot = keyof typeof SLOTS;

/**
 * A slot rendered as the `Media` shape the rest of the site already speaks,
 * so a bundled photograph and an owner upload are interchangeable.
 *
 * `created_at` is a fixed date rather than `new Date()`: these rows are
 * static, and a moving timestamp would make server output non-deterministic.
 */
function toMedia(id: ImageSlot, slot: Slot): Media {
  return {
    id: `local:${id}`,
    storage_path: slot.file,
    public_url: slot.file,
    kind: "image",
    alt: slot.alt,
    title: null,
    width: slot.width,
    height: slot.height,
    size_bytes: null,
    created_at: "2024-01-01T00:00:00.000Z",
  };
}

export const IMAGES = Object.fromEntries(
  Object.entries(SLOTS).map(([key, slot]) => [key, toMedia(key as ImageSlot, slot)]),
) as Record<ImageSlot, Media>;

/** The hero slider, in order. */
export const HERO_SLIDES: Media[] = [
  IMAGES.heroValley,
  IMAGES.heroFront,
  IMAGES.heroPines,
  IMAGES.heroHillside,
];

/** Everything, for the gallery and for seeding. */
export const ALL_MEDIA: Media[] = Object.values(IMAGES);
