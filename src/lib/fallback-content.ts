import { IMAGES } from "./media-library";
import type {
  Apartment,
  DiningItem,
  Facility,
  GalleryItem,
  Room,
  SiteSettings,
  Testimonial,
} from "./types";

/**
 * Demo content, mirroring `supabase/seed.sql`.
 *
 * Used only when the Supabase environment variables are absent, so the site
 * can be run, reviewed and screenshotted before a database exists. Once
 * `.env.local` is filled in, every one of these is replaced by live rows and
 * this file stops being read.
 *
 * Copy is transcribed from the live mistymeadowsresorts.com pages;
 * photography comes from `media-library.ts`, i.e. the files committed under
 * `public/media/`.
 */

export const DEMO_SETTINGS: SiteSettings = {
  brand_name: "Misty Meadows Resorts",
  legal_name: "Misty Meadows Resorts & Hotels Pvt. Ltd.",
  tagline: "Star-class rooms in the Kasauli hills, at 5,800 ft",
  intro:
    "Nestled in Kasauli Hills, at a height of 5800 ft, Misty Meadows offers star class accommodation with world class facilities. The resort is located just five and a half hour drive away from Delhi and only one and a half hours from Chandigarh. Surrounded by tall pine trees and spectacular mountains, the resort offers majestic views of the valley from every room. A peaceful place where you can unwind, relax and enjoy your vacation. Come, experience a luxurious holiday experience in the lap of nature.",
  address_lines: [
    "Misty Meadows Resorts, Kumarhatti",
    "Nahan Road, Distt. Solan (H.P.)",
    "Near Village Rundan Ghoro",
  ],
  map_url:
    "https://www.google.com/maps/search/?api=1&query=Misty+Meadows+Resorts+Kumarhatti+Solan",
  map_embed_url: null,
  phones: ["+91 92180 00140", "+91 98169 55589"],
  whatsapp: "+919218000140",
  emails: ["info@mistymeadowsresorts.com"],
  socials: {},
  hero_media_id: null,
  hero_video_url: null,
  logo_media_id: null,
  copyright_text: "Copyright 2021 Misty Meadows Resorts. All Rights Reserved",
  booking_note: "Book direct with the resort for the best available rate.",
  // The welcome band's arched plate. Owner uploads replace it from Settings.
  hero_media: IMAGES.welcome,
  logo_media: null,
};

const room = (
  slug: string,
  name: string,
  summary: string,
  description: string,
  max_guests: number,
  features: string[],
  sort_order: number,
  image: Room["image"],
): Room => ({
  id: slug,
  slug,
  name,
  summary,
  description,
  rate_inr: null,
  rate_note: "per night + applicable taxes",
  max_guests,
  size_note: null,
  features,
  image_id: null,
  gallery_ids: [],
  sort_order,
  published: true,
  image,
});

export const DEMO_ROOMS: Room[] = [
  room(
    "luxury-room",
    "Luxury Room",
    "Valley-facing room with a seating corner and a private balcony.",
    "Our signature room, with full-height glazing that frames the pine slopes and the valley beyond. A separate seating corner makes it comfortable for longer stays.",
    2,
    ["Valley view", "Private balcony", "Seating area", "Room service"],
    1,
    IMAGES.roomLuxury,
  ),
  room(
    "deluxe-room",
    "Deluxe Room without Balcony",
    "A warm, quiet room set back from the valley edge.",
    "The same finish and comfort as our balcony rooms, set slightly back into the property. The quietest rooms we have, and the best value.",
    2,
    ["Hill view", "Quiet wing", "Room service"],
    2,
    IMAGES.roomDeluxe,
  ),
  room(
    "superior-room-balcony",
    "Superior Room with Balcony",
    "Extra floor space and a balcony wide enough to sit out on.",
    "A larger room with a generous balcony — wide enough for two chairs and a table, so breakfast outside is a real option.",
    2,
    ["Valley view", "Wide balcony", "Seating area", "Room service"],
    3,
    IMAGES.roomSuperior,
  ),
  room(
    "luxury-room-terrace",
    "Luxury Room with Terrace",
    "Open terrace looking straight down the valley.",
    "A luxury room opening onto its own terrace, with an uninterrupted line of sight across the valley. The room our returning guests ask for by name.",
    2,
    ["Private terrace", "Valley view", "Seating area", "Room service"],
    4,
    IMAGES.roomTerrace,
  ),
  room(
    "premium-suite",
    "Premium Suite",
    "Our largest accommodation, suited to families and small groups.",
    "A suite with separate living space and the widest outlook on the property. Comfortable for a family or a small group travelling together.",
    4,
    ["Separate living area", "Valley view", "Balcony", "Room service"],
    5,
    IMAGES.suiteLounge,
  ),
];

export const DEMO_APARTMENTS: Apartment[] = [
  ["Studio Apartment", "Block B", "1 bedroom apartment with kitchen, lift access", 65000],
  ["Studio Apartment", "Block C", "Studio apartment", 25000],
  ["4 Bedroom Apartment", "Block C", "Four bedroom apartment", 80000],
  ["3 Bedroom Apartment", "Block C", "Three bedroom apartment", 65000],
  ["Duplex, 2 Rooms", "Block C", "Duplex with two rooms and a kitchen", 35000],
].map(([name, block, detail, rate], i) => ({
  id: `apt-${i}`,
  name: name as string,
  block: block as string,
  detail: detail as string,
  rate_monthly_inr: rate as number,
  image_id: null,
  sort_order: i + 1,
  published: true,
  image: [IMAGES.suiteBed, IMAGES.roomEvening, IMAGES.roomOutlook, IMAGES.roomDeluxe, IMAGES.roomSuperior][i] ?? null,
}));

export const DEMO_FACILITIES: Facility[] = [
  ["facility", "Multi-Cuisine Restaurant", "All-day dining with Indian, Chinese and Continental menus.", "dining"],
  ["facility", "Conference Room", "Meeting and conference space for corporate offsites.", "conference"],
  ["facility", "Clubhouse", "Indoor games including table tennis, plus a gym.", "clubhouse"],
  ["facility", "Parking Space", "On-site parking for residents and day guests.", "parking"],
  ["booking_benefit", "No booking fee", "Book direct and pay no reservation charge.", "tag"],
  ["booking_benefit", "Best rate guarantee", "The lowest available rate, direct from the resort.", "rate"],
  ["booking_benefit", "Reservations 24/7", "Reach the front desk at any hour.", "clock"],
  ["booking_benefit", "High-speed Wi-Fi", "Complimentary across the property.", "wifi"],
  ["booking_benefit", "Flexible amendments", "Support in case of cancellation or amendment.", "calendar"],
].map(([category, name, description, icon], i) => ({
  id: `fac-${i}`,
  category: category as Facility["category"],
  name: name as string,
  description: description as string,
  icon: icon as string,
  sort_order: i + 1,
  published: true,
}));

export const DEMO_DINING: DiningItem[] = [
  ["thali", "Veg Thali", "Dal makhani, mix vegetable, rice, salad, roti, raita", "350 + GST per thali", IMAGES.restaurantHall],
  ["thali", "Non-Veg Thali", "Murg makhani, mix vegetable, rice, salad, roti, raita", "450 + GST per thali", IMAGES.restaurantTable],
  ["picnic", "Day Picnic — Vegetarian", "Day picnic package, per person", "1600 + tax", IMAGES.terraceValley],
  ["picnic", "Day Picnic — Non-Vegetarian", "Day picnic package, per person", "2100 + tax", IMAGES.celebrations],
].map(([category, name, detail, price_note, image], i) => ({
  id: `din-${i}`,
  category: category as string,
  name: name as string,
  detail: detail as string,
  price_note: price_note as string,
  image_id: null,
  sort_order: i + 1,
  published: true,
  image: image as DiningItem["image"],
}));

export const DEMO_TESTIMONIALS: Testimonial[] = [
  {
    author: "Vijendra Kaushik",
    headline: "Beautiful Property",
    quote:
      "Beautiful property nestled in the hills. Each room had a huge balcony with an excellent view. Went there to celebrate my wife's 40th birthday with our entire family. The service was outstanding. The staff was very courteous and efficient.",
  },
  {
    author: "Rehana",
    headline: "Beautiful Location",
    quote:
      "The hotel has a beautiful location. The staff are too good. They really take care of each and everything as I was travelling alone. If you visit Kumarhatti this is the place for your comfort.",
  },
  {
    author: "Pulkit Kumar",
    headline: "Amazing Services",
    quote:
      "We were a group of 7 people and had a lovely time here. The hospitality is top-notch. Rooms were very spacious and I have never seen such big balconies. Food was amazing, and the view from the balcony is amazing.",
  },
].map((t, i) => ({
  id: `test-${i}`,
  author: t.author,
  headline: t.headline,
  quote: t.quote,
  rating: 5,
  source: null,
  stay_date: null,
  sort_order: i + 1,
  published: true,
}));

/**
 * The gallery, grouped the way the gallery page filters it. `hero` is a
 * category in its own right so the owner can decide what opens the site
 * without touching the slider component.
 */
export const DEMO_GALLERY: GalleryItem[] = (
  [
    ["hero", "Bougainvillea over the valley", IMAGES.heroValley],
    ["hero", "The resort forecourt", IMAGES.heroFront],
    ["hero", "Pine slopes below the property", IMAGES.heroPines],
    ["hero", "Misty Meadows from across the valley", IMAGES.heroHillside],
    ["resort", "Cloud through the pines", IMAGES.welcome],
    ["resort", "The entrance and gardens", IMAGES.panorama],
    ["rooms", "Luxury room", IMAGES.roomLuxury],
    ["rooms", "Luxury room with terrace", IMAGES.roomTerrace],
    ["rooms", "Superior room", IMAGES.roomSuperior],
    ["rooms", "Room with balcony", IMAGES.roomBalcony],
    ["rooms", "Premium suite, sitting room", IMAGES.suiteLounge],
    ["rooms", "Premium suite", IMAGES.suiteBed],
    ["rooms", "Deluxe room", IMAGES.roomDeluxe],
    ["rooms", "A room in the evening", IMAGES.roomEvening],
    ["rooms", "Balcony outlook", IMAGES.roomOutlook],
    ["dining", "The restaurant", IMAGES.restaurantHall],
    ["dining", "Laid for lunch", IMAGES.restaurantTable],
    ["dining", "A table on the terrace", IMAGES.terraceValley],
    ["events", "The terrace at dusk", IMAGES.celebrations],
  ] as const
).map(([category, caption, media], i) => ({
  id: `gal-${i}`,
  media_id: media.id,
  caption,
  category,
  sort_order: i + 1,
  published: true,
  media,
}));
