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
  ('booking_benefit', 'No booking fee',       'Book direct and pay no reservation charge.',              'peak', 1),
  ('booking_benefit', 'Best rate guarantee', 'The lowest available rate, direct from the resort.',       'peak', 2),
  ('booking_benefit', 'Reservations 24/7',   'Reach the front desk at any hour.',                        'peak', 3),
  ('booking_benefit', 'High-speed Wi-Fi',    'Complimentary across the property.',                       'peak', 4),
  ('booking_benefit', 'Flexible amendments', 'Support in case of cancellation or amendment.',            'peak', 5)
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
