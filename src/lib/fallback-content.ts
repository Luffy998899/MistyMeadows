import { IMAGES } from "./media-library";
import type {
  Apartment,
  Attraction,
  DiningItem,
  Facility,
  GalleryItem,
  Room,
  Offer,
  SiteSettings,
  Testimonial,
  Video,
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
  /*
    Only the page we could confirm. There are several "Misty Meadows"
    Facebook pages and no confirmed Instagram profile, so the rest are left
    for the owner to add under Settings rather than guessed at — a social
    icon pointing at somebody else's page is worse than no icon.
  */
  socials: { facebook: "https://www.facebook.com/mistymeadowsresorts/" },
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
  gst_percent: null,
  max_guests,
  size_note: null,
  features,
  image_id: null,
  video_id: null,
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

/**
 * What there is to see within a morning's drive.
 *
 * Distances are quoted **from Solan town**, which is how every published
 * figure for these places is quoted and how the owner supplied them. The
 * resort is a short drive from Solan on the Kalka-Shimla road, so a guest
 * setting off from here will not drive exactly these numbers — which is
 * why they are stored as free text and are editable in the admin panel
 * rather than being computed.
 *
 * Copy for Mohan Shakti, the Bon Monastery, Dagshai, Barog and Jatoli was
 * supplied by the resort. The rest is sourced, and deliberately vaguer
 * where a figure could not be confirmed.
 *
 * No photographs are bundled: these are public landmarks, not the resort's
 * property. Each row has an `image_id` for an upload from /admin, and
 * `src/lib/attraction-photos.ts` additionally picks up a file dropped in at
 * `public/media/attractions/<slug>.jpg`. Until one of those exists the
 * layout draws a labelled placeholder rather than a broken frame.
 */
const attraction = (
  slug: string,
  name: string,
  category: string,
  distance_note: string,
  summary: string,
  description: string,
  highlights: string[],
  visit_note: string | null,
  sort_order: number,
): Attraction => ({
  id: slug,
  slug,
  name,
  category,
  distance_note,
  summary,
  description,
  visit_note,
  highlights,
  map_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${name} Solan Himachal Pradesh`,
  )}`,
  image_id: null,
  sort_order,
  published: true,
  image: null,
});

export const DEMO_ATTRACTIONS: Attraction[] = [
  attraction(
    "mohan-shakti-heritage-park",
    "Mohan Shakti Heritage Park",
    "Heritage park",
    "From Solan · 14.8 km (38 min drive)",
    "An ancient-style heritage park of carved sculpture and statuary, with the Shivaliks around it.",
    "An ancient heritage park constructed with beautifully carved sculptures and statues. While exploring the park through grasslands, one can enjoy the picturesque beauty of the surrounding Shivalik range.",
    ["Carved sculpture and statuary", "Grassland walks", "Shivalik views"],
    null,
    1,
  ),
  attraction(
    "bon-monastery",
    "Bon Monastery, Solan",
    "Monastery",
    "From Solan · 16 km (45 min drive)",
    "The second oldest monastery in the world of its type — quiet, and worth the drive.",
    "The 2nd oldest monastery in the world of its type (bon) is definitely fuel to one's mind and soul. Do visit to spend some revitalising time in the peace and serenity prevailing in the area.",
    [
      "The Menri Monastery Main Temple",
      "The Yungdrung Bon Monastic Centre",
      "Library",
      "Museum",
    ],
    "Visiting hours: 10:00 to 12:00 and 17:00 to 18:00, all days.",
    2,
  ),
  attraction(
    "dagshai-jail-museum",
    "The Dagshai Jail Museum",
    "Colonial history",
    "From Solan · 11 km (30 min drive)",
    "Built by the British in 1849 — the only jail museum in India.",
    "Constructed by the Britishers in 1849, the only Jail Museum in India offers an insight into how convicts were kept in the past. You can even look out for the prison in which Mahatma Gandhi stayed for a day. Do visit the Dagshai Cantonment, the Cemetery and the Saint Patrick Church.",
    [
      "The jail museum",
      "Gandhi's cell",
      "Dagshai Cantonment",
      "The Cemetery",
      "Saint Patrick Church",
    ],
    null,
    3,
  ),
  attraction(
    "barog-tunnel",
    "Barog Tunnel — Kalka Shimla Rail Track",
    "Railway heritage",
    "From Solan · 8 km",
    "Tunnel No. 33, on a railway line UNESCO has declared a World Heritage Site.",
    "The narrow gauge Kalka Shimla Railway has been declared a World Heritage Site by UNESCO. The whole network consists of 103 tunnels, with tunnel no. 33 at Barog being the 2nd largest in Asia. Organise a small getaway on the toy train to nearby destinations and feel the essence of Dev Bhoomi.",
    ["UNESCO World Heritage line", "Tunnel No. 33", "The toy train", "Barog station"],
    "There are only a handful of toy train services a day, and they fill up in season — check the timings before planning around them.",
    4,
  ),
  attraction(
    "jatoli-shiv-temple",
    "Jatoli Shiv Temple, Solan",
    "Temples",
    "From Solan · 6 km (30 min drive)",
    "Dravidian in style, and one of the oldest temples of Lord Shiva here.",
    "The Dravidian style Jatoli Shiv Temple is one of the oldest temples of Lord Shiva. Its construction took around 39 years to complete. The cave inside the temple is a major attraction.",
    ["Dravidian shikhara", "The cave inside the temple", "Views across the valley"],
    null,
    5,
  ),
  attraction(
    "kasauli",
    "Kasauli",
    "Hill station",
    "From Solan · 30 km",
    "The Mall, Christ Church, and the walk out to Monkey Point for the sunset.",
    "The hill station the ridge is named for, and the obvious half-day out. Christ Church dates from 1853; the Mall is short enough to walk end to end in an afternoon; and the Gilbert Trail runs level along the hillside through pine and oak. Monkey Point, at the far end inside the air force station, is the one to time for sunset.",
    ["Christ Church", "The Mall", "Gilbert Trail", "Monkey Point", "Sunset Point"],
    "Monkey Point sits inside an Air Force station: photo ID is required, phones and cameras are not allowed up, and the timings change seasonally.",
    6,
  ),
  attraction(
    "shoolini-mata-temple",
    "Shoolini Mata Temple, Solan",
    "Temples",
    "From Solan · 2 km",
    "The goddess Solan is named after, and the June fair held in her honour.",
    "A short walk off the old court road in Solan, and the reason the town has its name. The temple is modest and busy rather than grand. The Shoolini fair in June turns the whole town out for three days of processions, music and stalls.",
    ["The town's namesake shrine", "Shoolini fair, June"],
    null,
    7,
  ),
  attraction(
    "sanawar",
    "Sanawar — The Lawrence School",
    "Colonial history",
    "On the Kasauli road",
    "One of the oldest boarding schools in the country, on a wooded ridge above the road.",
    "Founded in 1847 by Henry Lawrence for the children of British soldiers, and still running. The campus spreads across a ridge of deodar and pine, with a chapel and quadrangles that have barely changed. Not a public attraction as such, but the drive up and the ridge itself are worth the detour.",
    ["1847 foundation", "Ridge-top campus", "The chapel"],
    "A working school — visitors are admitted at the school's discretion, so ask at the gate rather than assuming access.",
    8,
  ),
  attraction(
    "nauni-university",
    "Dr Y. S. Parmar University, Nauni",
    "Gardens",
    "From Solan · 14 km",
    "A horticulture and forestry campus with a botanical garden open to visitors.",
    "The state's horticulture and forestry university, on the Solan–Rajgarh road. The campus is essentially a hillside of collections — botanical garden, floriculture beds, orchards and forestry plots — and is one of the better places in the district to spend a morning walking slowly and looking at plants.",
    ["Botanical garden", "Floriculture beds", "Orchards", "Forestry plots"],
    "A working research campus: visit during working hours and check at the gate.",
    9,
  ),
  attraction(
    "karol-tibba",
    "Karol Tibba & the Pandava Cave",
    "Walks & treks",
    "Trailhead at Chambaghat · 5 km from Solan",
    "The highest point above Solan, and a cave the Pandavas are said to have sheltered in.",
    "The walk starts at Chambaghat and climbs through pine and oak to the ridge — around four hours up if you are unhurried, and the whole Solan valley opens out at the top. Near the summit is the Pandava cave, long enough that nobody local will tell you where it ends, and the small Karoli Mata temple.",
    ["Roughly 4 hours up", "Pandava cave", "Karoli Mata temple", "Valley panorama"],
    "A full day out. Start early, carry water, and do not attempt it in rain — the last section is loose underfoot.",
    10,
  ),
  attraction(
    "chail",
    "Chail",
    "Day trip",
    "From Solan · 30 km",
    "The palace, the wildlife sanctuary, and the highest cricket ground in the world.",
    "Built by the Maharaja of Patiala after he was barred from Shimla, and still the most enjoyable full day out from here. The palace is now a hotel and its grounds are open; the cricket ground above it, cut flat out of a hilltop at around 2,400 m, is the highest anywhere; and the sanctuary around it is deodar forest with ghoral and sambar in it.",
    ["Chail Palace grounds", "The world's highest cricket ground", "Wildlife sanctuary"],
    "A full day. The road is narrow in places and slower than the distance suggests.",
    11,
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
  gst_percent: null,
  image_id: null,
  sort_order: i + 1,
  published: true,
  image: [IMAGES.suiteBed, IMAGES.roomEvening, IMAGES.roomOutlook, IMAGES.roomDeluxe, IMAGES.roomSuperior][i] ?? null,
}));

export const DEMO_FACILITIES: Facility[] = (
  [
    ["facility", "Multi-Cuisine Restaurant", "All-day dining with Indian, Chinese and Continental menus.", "dining", IMAGES.restaurantHall],
    ["facility", "Conference Room", "Meeting and conference space for corporate offsites.", "conference", IMAGES.restaurantTable],
    ["facility", "Clubhouse", "Indoor games including table tennis, plus a gym.", "clubhouse", IMAGES.suiteLounge],
    ["facility", "Parking Space", "On-site parking for residents and day guests.", "parking", IMAGES.heroFront],
    ["booking_benefit", "No booking fee", "Book direct and pay no reservation charge.", "tag", null],
    ["booking_benefit", "Best rate guarantee", "The lowest available rate, direct from the resort.", "rate", null],
    ["booking_benefit", "Reservations 24/7", "Reach the front desk at any hour.", "clock", null],
    ["booking_benefit", "High-speed Wi-Fi", "Complimentary across the property.", "wifi", null],
    ["booking_benefit", "Flexible amendments", "Support in case of cancellation or amendment.", "calendar", null],
  ] as const
).map(([category, name, description, icon, image], i) => ({
  id: `fac-${i}`,
  category: category as Facility["category"],
  name,
  description,
  icon,
  image_id: null,
  sort_order: i + 1,
  published: true,
  image,
}));

/**
 * One seasonal offer, set to announce itself.
 *
 * It exists in the fixtures mainly so the announcement panel is visible
 * without a database — the real ones are written in the admin panel. The
 * dates are open-ended on purpose: a fixture with a fixed window would
 * quietly stop appearing the moment it expired, which looks like a bug.
 */
export const DEMO_OFFERS: Offer[] = [
  {
    id: "offer-midweek",
    slug: "midweek-in-the-hills",
    title: "Midweek in the hills",
    summary:
      "Stay Sunday to Thursday and breakfast for two is on us, along with a late checkout at 2pm.",
    body:
      "The valley is at its best on a weekday — the roads are quiet and so is the terrace. Book any Sunday-to-Thursday night direct with the resort and breakfast for two is included, with checkout pushed back to 2pm so the morning is not a rush.",
    terms: "Subject to availability. Not combinable with other offers. Direct bookings only.",
    valid_from: null,
    valid_to: null,
    image_id: null,
    announce: true,
    announce_version: 1,
    sort_order: 1,
    published: true,
    image: IMAGES.terraceValley,
  },
];

/**
 * Videos.
 *
 * Nothing is bundled — there is no film of the resort in the repository —
 * so this is empty and the video band renders nothing until the owner adds
 * one under Videos in the admin panel. An empty band is better than a
 * placeholder that looks like a broken player.
 */
export const DEMO_VIDEOS: Video[] = [];

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
