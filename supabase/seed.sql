-- =====================================================================
-- Misty Meadows Resorts — seed data
--
-- Everything here is transcribed from the live mistymeadowsresorts.com
-- pages. Where a figure could not be read with confidence it is left
-- NULL rather than guessed — the admin panel is the place to fill those
-- in.
--
-- Safe to re-run. Every statement is guarded so it will not duplicate
-- rows and will not overwrite anything edited in the admin panel. Note
-- that `on conflict do nothing` alone would NOT achieve this: these
-- tables have surrogate uuid primary keys, so nothing ever conflicts and
-- every re-run would append a second copy. Hence the `where not exists`
-- guards on natural keys below.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Site settings
--
-- Only populated while still untouched (intro empty), so re-running this
-- file never resets contact details the owner has since changed.
-- ---------------------------------------------------------------------

update public.site_settings set
  brand_name    = 'Misty Meadows Resorts',
  legal_name    = 'Misty Meadows Resorts & Hotels Pvt. Ltd.',
  tagline       = 'Star-class rooms in the Kasauli hills, at 5,800 ft',
  intro         = 'Nestled in Kasauli Hills, at a height of 5800 ft, Misty Meadows offers star class accommodation with world class facilities. The resort is located just five and a half hour drive away from Delhi and only one and a half hours from Chandigarh. Surrounded by tall pine trees and spectacular mountains, the resort offers majestic views of the valley from every room. A peaceful place where you can unwind, relax and enjoy your vacation. Come, experience a luxurious holiday experience in the lap of nature.',
  address_lines = array[
    'Misty Meadows Resorts, Kumarhatti',
    'Nahan Road, Distt. Solan (H.P.)',
    'Near Village Rundan Ghoro'
  ],
  phones        = array['+91 92180 00140', '+91 98169 55589'],
  emails        = array['info@mistymeadowsresorts.com'],
  whatsapp      = '+919218000140',
  socials       = '{}'::jsonb,
  map_url       = 'https://www.google.com/maps/search/?api=1&query=Misty+Meadows+Resorts+Kumarhatti+Solan',
  booking_note  = 'Book direct with the resort for the best available rate.',
  copyright_text = 'Copyright 2021 Misty Meadows Resorts. All Rights Reserved'
where id and coalesce(intro, '') = '';

-- ---------------------------------------------------------------------
-- Rooms
--
-- Names are exactly as listed on the live Rooms page. Nightly rates are
-- left NULL on purpose: the rates visible on third-party listings could
-- not be reliably matched to these five room names, and publishing a
-- wrong tariff is worse than showing "Rates on request".
--
-- `do nothing` rather than `do update` so a re-run never clobbers copy
-- that has since been edited in the admin panel.
-- ---------------------------------------------------------------------

insert into public.rooms (slug, name, summary, description, max_guests, features, sort_order) values
  ('luxury-room', 'Luxury Room',
   'Valley-facing room with a seating corner and a private balcony.',
   'Our signature room, with full-height glazing that frames the pine slopes and the valley beyond. A separate seating corner makes it comfortable for longer stays.',
   2, array['Valley view', 'Private balcony', 'Seating area', 'Room service'], 1),

  ('deluxe-room', 'Deluxe Room without Balcony',
   'A warm, quiet room set back from the valley edge.',
   'The same finish and comfort as our balcony rooms, set slightly back into the property. The quietest rooms we have, and the best value.',
   2, array['Hill view', 'Quiet wing', 'Room service'], 2),

  ('superior-room-balcony', 'Superior Room with Balcony',
   'Extra floor space and a balcony wide enough to sit out on.',
   'A larger room with a generous balcony — wide enough for two chairs and a table, so breakfast outside is a real option.',
   2, array['Valley view', 'Wide balcony', 'Seating area', 'Room service'], 3),

  ('luxury-room-terrace', 'Luxury Room with Terrace',
   'Open terrace looking straight down the valley.',
   'A luxury room opening onto its own terrace, with an uninterrupted line of sight across the valley. The room our returning guests ask for by name.',
   2, array['Private terrace', 'Valley view', 'Seating area', 'Room service'], 4),

  ('premium-suite', 'Premium Suite',
   'Our largest accommodation, suited to families and small groups.',
   'A suite with separate living space and the widest outlook on the property. Comfortable for a family or a small group travelling together.',
   4, array['Separate living area', 'Valley view', 'Balcony', 'Room service'], 5)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- Independent accommodation (monthly rates, as published on the Rooms page)
-- ---------------------------------------------------------------------

insert into public.apartments (name, block, detail, rate_monthly_inr, sort_order)
select v.name, v.block, v.detail, v.rate, v.sort
from (values
  ('Studio Apartment',    'Block B', '1 bedroom apartment with kitchen, lift access', 65000, 1),
  ('Studio Apartment',    'Block C', 'Studio apartment',                               25000, 2),
  ('4 Bedroom Apartment', 'Block C', 'Four bedroom apartment',                         80000, 3),
  ('3 Bedroom Apartment', 'Block C', 'Three bedroom apartment',                        65000, 4),
  ('Duplex, 2 Rooms',     'Block C', 'Duplex with two rooms and a kitchen',            35000, 5)
) as v(name, block, detail, rate, sort)
where not exists (
  select 1 from public.apartments a
  where a.name = v.name and coalesce(a.block, '') = coalesce(v.block, '')
);

-- ---------------------------------------------------------------------
-- Facilities & direct-booking benefits
-- ---------------------------------------------------------------------

insert into public.facilities (category, name, description, icon, sort_order)
select v.category, v.name, v.description, v.icon, v.sort
from (values
  ('facility', 'Multi-Cuisine Restaurant', 'All-day dining with Indian, Chinese and Continental menus.', 'dining',     1),
  ('facility', 'Conference Room',          'Meeting and conference space for corporate offsites.',       'conference', 2),
  ('facility', 'Clubhouse',                'Indoor games including table tennis, plus a gym.',           'clubhouse',  3),
  ('facility', 'Parking Space',            'On-site parking for residents and day guests.',              'parking',    4),
  ('booking_benefit', 'No booking fee',       'Book direct and pay no reservation charge.',              'tag', 1),
  ('booking_benefit', 'Best rate guarantee', 'The lowest available rate, direct from the resort.',       'rate', 2),
  ('booking_benefit', 'Reservations 24/7',   'Reach the front desk at any hour.',                        'clock', 3),
  ('booking_benefit', 'High-speed Wi-Fi',    'Complimentary across the property.',                       'wifi', 4),
  ('booking_benefit', 'Flexible amendments', 'Support in case of cancellation or amendment.',            'calendar', 5)
) as v(category, name, description, icon, sort)
where not exists (
  select 1 from public.facilities f
  where f.category = v.category and f.name = v.name
);

-- ---------------------------------------------------------------------
-- Dining — rates exactly as published
-- ---------------------------------------------------------------------

insert into public.dining_items (category, name, detail, price_note, sort_order)
select v.category, v.name, v.detail, v.price_note, v.sort
from (values
  ('thali',  'Veg Thali',                     'Dal makhani, mix vegetable, rice, salad, roti, raita',  '350 + GST per thali', 1),
  ('thali',  'Non-Veg Thali',                 'Murg makhani, mix vegetable, rice, salad, roti, raita', '450 + GST per thali', 2),
  ('picnic', 'Day Picnic — Vegetarian',       'Day picnic package, per person',                        '1600 + tax',          3),
  ('picnic', 'Day Picnic — Non-Vegetarian',   'Day picnic package, per person',                        '2100 + tax',          4)
) as v(category, name, detail, price_note, sort)
where not exists (
  select 1 from public.dining_items d
  where d.category = v.category and d.name = v.name
);

-- ---------------------------------------------------------------------
-- Testimonials — verbatim from the live site
-- ---------------------------------------------------------------------

insert into public.testimonials (author, headline, quote, rating, sort_order)
select v.author, v.headline, v.quote, 5, v.sort
from (values
  ('Vijendra Kaushik', 'Beautiful Property',
   'Beautiful property nestled in the hills. Each room had a huge balcony with an excellent view. Went there to celebrate my wife''s 40th birthday with our entire family. The service was outstanding. The staff was very courteous and efficient. We were 20 people in total along with drivers and maids. All our staff was also accommodated (we had requested for the same on booking).',
   1),
  ('Rehana', 'Beautiful Location',
   'The hotel has a beautiful location. The staff are too good. They really take care of each and everything as I was travelling alone. If you visit Kumarhatti this is the place for your comfort.',
   2),
  ('Pulkit Kumar', 'Amazing Services',
   'We were a group of 7 people and had a lovely time here. The hospitality is top-notch. Rooms were very spacious and I have never seen such big balconies where you can even party privately if you are in a group. Food was amazing. The view from the balcony is amazing. The resort has a gym, table tennis and more. We are surely going to visit there again.',
   3)
) as v(author, headline, quote, sort)
where not exists (
  select 1 from public.testimonials t where t.author = v.author
);

-- ---------------------------------------------------------------------
-- Photography
--
-- The resort's own photographs ship with the application under
-- `public/media/`, so the site has real imagery the moment it is
-- deployed — before anyone signs in to /admin.
--
-- Each one is registered as a `media` row whose `public_url` is the
-- application path rather than a Supabase Storage URL. Nothing in the
-- read path cares which it is: the admin panel can re-point any slot at
-- an uploaded file, and these rows simply stop being referenced.
--
-- `storage_path` is unique, so `on conflict do nothing` is genuinely
-- idempotent here (unlike the surrogate-key tables above).
-- ---------------------------------------------------------------------

insert into public.media (storage_path, public_url, kind, alt, title, width, height) values
  ('/media/slider-valley-bloom.jpg',    '/media/slider-valley-bloom.jpg',    'image', 'Bougainvillea in flower above a pine valley at Misty Meadows', 'Valley in bloom',        1920, 1080),
  ('/media/slider-resort-front.jpg',    '/media/slider-resort-front.jpg',    'image', 'The entrance forecourt at Misty Meadows Resorts in full sun',  'The resort, from the gate', 1920, 1080),
  ('/media/slider-pine-slopes.jpg',     '/media/slider-pine-slopes.jpg',     'image', 'Chir pine covering the slopes below the resort',               'Pine slopes',            1920, 1080),
  ('/media/slider-resort-hillside.jpg', '/media/slider-resort-hillside.jpg', 'image', 'Misty Meadows seen from across the valley, set into the hillside', 'Across the valley',  1920, 1080),
  ('/media/welcome-misty-terrace.jpg',  '/media/welcome-misty-terrace.jpg',  'image', 'Cloud rolling through the pines above the resort''s stone terrace', 'Misty terrace',      640,  500),
  ('/media/panorama-entrance.jpg',      '/media/panorama-entrance.jpg',      'image', 'Panorama across the resort entrance, gardens and stone carving', 'Entrance panorama',   1920, 700),
  ('/media/celebrations-terrace.jpg',   '/media/celebrations-terrace.jpg',   'image', 'The open terrace laid for dinner at dusk, lights along the steps', 'Terrace at dusk',    730,  705),
  ('/media/terrace-valley-view.jpg',    '/media/terrace-valley-view.jpg',    'image', 'A table for two on a private terrace looking down the valley', 'Terrace table',          2000, 1333),
  ('/media/restaurant-hall.jpg',        '/media/restaurant-hall.jpg',        'image', 'The multi-cuisine restaurant, laid up and lit by the valley windows', 'The restaurant',  2000, 1333),
  ('/media/restaurant-table.jpg',       '/media/restaurant-table.jpg',       'image', 'A restaurant table set with red napkins and a small succulent', 'Laid for lunch',        2000, 1333),
  ('/media/room-luxury.jpg',            '/media/room-luxury.jpg',            'image', 'Luxury room with a seating corner and the valley through the glazing', 'Luxury Room',    730,  705),
  ('/media/room-terrace.jpg',           '/media/room-terrace.jpg',           'image', 'Room opening onto a private terrace with chairs and a table',  'Luxury Room with Terrace', 730, 705),
  ('/media/room-superior.jpg',          '/media/room-superior.jpg',          'image', 'Superior room with a wide window onto the wooded hillside',    'Superior Room',          730,  705),
  ('/media/room-balcony.jpg',           '/media/room-balcony.jpg',           'image', 'Room with full-height glazing onto a balcony above the valley', 'Room with balcony',     730,  705),
  ('/media/suite-premium-lounge.jpg',   '/media/suite-premium-lounge.jpg',   'image', 'Premium suite with a separate sofa lounge beside the bed',     'Premium Suite',          2000, 1333),
  ('/media/suite-premium-bed.jpg',      '/media/suite-premium-bed.jpg',      'image', 'Premium suite bedroom with seating and a writing desk',        'Premium Suite, bedroom', 2000, 1333),
  ('/media/room-deluxe-desk.jpg',       '/media/room-deluxe-desk.jpg',       'image', 'Deluxe room with a writing desk, television and mirror',       'Deluxe Room',            2000, 1333),
  ('/media/room-evening.jpg',           '/media/room-evening.jpg',           'image', 'A room in the evening, wall lights on and the curtains drawn',  'A room at dusk',        2000, 1333),
  ('/media/room-balcony-outlook.jpg',   '/media/room-balcony-outlook.jpg',   'image', 'Looking from the bed through sliding doors onto a balcony',    'Balcony outlook',        2000, 1333)
on conflict (storage_path) do nothing;

-- Attach a photograph to each room, but only where one has not been set,
-- so a re-run never replaces a picture chosen in the admin panel.
update public.rooms r
set image_id = m.id
from public.media m
where r.image_id is null
  and m.storage_path = case r.slug
    when 'luxury-room'           then '/media/room-luxury.jpg'
    when 'deluxe-room'           then '/media/room-deluxe-desk.jpg'
    when 'superior-room-balcony' then '/media/room-superior.jpg'
    when 'luxury-room-terrace'   then '/media/room-terrace.jpg'
    when 'premium-suite'         then '/media/suite-premium-lounge.jpg'
  end;

update public.dining_items d
set image_id = m.id
from public.media m
where d.image_id is null
  and m.storage_path = case d.name
    when 'Veg Thali'                   then '/media/restaurant-hall.jpg'
    when 'Non-Veg Thali'               then '/media/restaurant-table.jpg'
    when 'Day Picnic — Vegetarian'     then '/media/terrace-valley-view.jpg'
    when 'Day Picnic — Non-Vegetarian' then '/media/celebrations-terrace.jpg'
  end;

-- The welcome band's arched plate.
update public.site_settings s
set hero_media_id = m.id
from public.media m
where s.hero_media_id is null
  and m.storage_path = '/media/welcome-misty-terrace.jpg';

-- ---------------------------------------------------------------------
-- Gallery
--
-- `hero` is a category in its own right: those four are what the home
-- page slider shows, so the owner can change what opens the site from
-- the Gallery screen without a developer.
-- ---------------------------------------------------------------------

insert into public.gallery_items (media_id, caption, category, sort_order)
select m.id, v.caption, v.category, v.sort
from (values
  ('/media/slider-valley-bloom.jpg',    'Bougainvillea over the valley',   'hero',    1),
  ('/media/slider-resort-front.jpg',    'The resort forecourt',            'hero',    2),
  ('/media/slider-pine-slopes.jpg',     'Pine slopes below the property',  'hero',    3),
  ('/media/slider-resort-hillside.jpg', 'Misty Meadows from across the valley', 'hero', 4),
  ('/media/welcome-misty-terrace.jpg',  'Cloud through the pines',         'resort',  5),
  ('/media/panorama-entrance.jpg',      'The entrance and gardens',        'resort',  6),
  ('/media/room-luxury.jpg',            'Luxury room',                     'rooms',   7),
  ('/media/room-terrace.jpg',           'Luxury room with terrace',        'rooms',   8),
  ('/media/room-superior.jpg',          'Superior room',                   'rooms',   9),
  ('/media/room-balcony.jpg',           'Room with balcony',               'rooms',  10),
  ('/media/suite-premium-lounge.jpg',   'Premium suite, sitting room',     'rooms',  11),
  ('/media/suite-premium-bed.jpg',      'Premium suite',                   'rooms',  12),
  ('/media/room-deluxe-desk.jpg',       'Deluxe room',                     'rooms',  13),
  ('/media/room-evening.jpg',           'A room in the evening',           'rooms',  14),
  ('/media/room-balcony-outlook.jpg',   'Balcony outlook',                 'rooms',  15),
  ('/media/restaurant-hall.jpg',        'The restaurant',                  'dining', 16),
  ('/media/restaurant-table.jpg',       'Laid for lunch',                  'dining', 17),
  ('/media/terrace-valley-view.jpg',    'A table on the terrace',          'dining', 18),
  ('/media/celebrations-terrace.jpg',   'The terrace at dusk',             'events', 19)
) as v(path, caption, category, sort)
join public.media m on m.storage_path = v.path
where not exists (
  select 1 from public.gallery_items g where g.media_id = m.id
);
