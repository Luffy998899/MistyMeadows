# Misty Meadows Resorts

Website and admin panel for Misty Meadows Resorts & Hotels Pvt. Ltd. —
Kumarhatti, Nahan Road, Distt. Solan, Himachal Pradesh.

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Supabase · Nodemailer

---

## What the owner can change without a developer

Everything on the public site is stored in the database and edited at
`/admin`:

| Screen | Controls |
| --- | --- |
| Rooms & suites | Room types, rates, features, photographs |
| Long-stay apartments | Monthly-let inventory and rates |
| Facilities & benefits | On-site facilities, and the "booking direct" points |
| Dining | Thalis, picnic packages, prices |
| Testimonials | Guest reviews and star ratings |
| Attractions | Places to visit nearby, with distances and photographs |
| Gallery | Photographs, grouped by category |
| Offers | Seasonal packages with validity dates |
| News & events | Posts, with optional future publish dates |
| Enquiries | Every website enquiry, with status and CSV export |
| Settings | Address, phones, emails, social links, logo, hero image, SMTP |

**Every image on the site is replaceable from `/admin`.** The resort's own
photographs ship with the repository (see *Photography* below) and are
registered in the database by the seed, so the site is complete on day one;
uploading a new file and pointing a room, a dining item or the gallery at it
replaces the bundled one with no code change. Where nothing is set at all,
the layout shows a quiet placeholder plate rather than a broken frame.

---

## Setup

### 1. Create the Supabase project

At [supabase.com](https://supabase.com), create a project, then open
**SQL Editor** and run, in this order:

1. `supabase/migrations/0001_init.sql` — tables, row level security,
   storage bucket
1. `supabase/migrations/0002_attractions.sql` — the attractions table
2. `supabase/seed.sql` — the real resort content transcribed from the
   existing website (rooms, apartments, dining rates, testimonials, address)

Both files are safe to re-run: nothing is duplicated, and the seed will
not overwrite anything you have since edited in the admin panel.

### 2. Configure the app

```bash
cp .env.example .env.local
```

Fill in the three values from **Project Settings → API**. The service role key
is required — enquiries and email do not work without it.

### 3. Create the owner's login

In Supabase, go to **Authentication → Users → Add user**, and create the
owner's account with a password. Confirm the email so they can sign in.

Then, in **SQL Editor**, add them to the admin allowlist:

```sql
insert into public.admin_users (user_id, email, full_name)
select id, email, 'Owner name'
from auth.users
where email = 'owner@example.com';
```

Having a Supabase account is **not** enough to reach `/admin` — a row in
`admin_users` is what grants access. To remove someone's access, delete their
row.

### 4. Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

### 5. Turn on email notifications

Sign in at `/admin`, go to **Settings → Email**, and enter the SMTP details of
the mailbox that should send notifications. Then use **Send test email** to
confirm it works.

For Gmail / Google Workspace: host `smtp.gmail.com`, port `587`, and an
[app password](https://support.google.com/accounts/answer/185833) — not the
account password.

Enquiries are saved to the database whether or not email is configured, so
nothing is ever lost. If a notification fails to send, the reason is recorded
against that enquiry and shown in the admin inbox.

---

## Demo mode

With no Supabase environment variables set, the site runs against the fixtures
in `src/lib/fallback-content.ts` — the same content, and the same
photographs, as `seed.sql`. This makes
the site reviewable before a database exists. The admin panel and the enquiry
form both say plainly that they are not connected.

Once `.env.local` is filled in, demo mode switches itself off.

---

## Security notes

- **Row level security is on for every table.** Published content is publicly
  readable; writes require a row in `admin_users`. The check runs in the
  database, so it holds even if application code is wrong.
- **SMTP credentials live in `secure_settings`,** which has RLS enabled and
  *no policies at all* — meaning no anon or signed-in user can read it, only
  the server's service-role client. The saved password is never sent back to
  the browser.
- **The service role key is server-only.** `src/lib/supabase/admin.ts` is
  marked `server-only`, so importing it into a client component fails the
  build rather than leaking the key.
- The enquiry form is rate limited per IP and carries a honeypot field.
- CSV export escapes leading `=`, `+`, `-` and `@` so a crafted enquiry cannot
  become a spreadsheet formula.

---

## Commands

```bash
npm run dev         # development server
npm run build       # production build
npm start           # serve the production build
npm run typecheck   # tsc --noEmit
```

There is no lint script: `next lint` is deprecated and removed in Next 16, and
it only offers an interactive setup rather than running. Add the ESLint CLI
directly if you want linting.

### Verifying the SQL

```bash
./scripts/verify-sql.sh
```

Spins up a throwaway local Postgres (with small stubs for Supabase's `auth`
and `storage` schemas), applies the migration and seed, then asserts that
they are idempotent, that the seed does not clobber edited content, and that
row level security behaves correctly for an anonymous visitor, a signed-in
non-admin, and an admin. Requires a local PostgreSQL server binary; it never
touches a real project.

### Checking the front end

With a server running on port 3210:

```bash
node scripts/screenshot.mjs /rooms rooms 1440,768,375   # layout at each width
node scripts/contrast.mjs / /rooms /contact             # WCAG AA contrast
node scripts/interactions.mjs                           # nav, keyboard, forms
```

`screenshot.mjs` writes to `.screenshots/` and reports horizontal overflow,
failed requests and console errors. `contrast.mjs` measures *rendered* colour
against AA — it parses via canvas, so it handles the `oklab()` values Tailwind
emits for opacity modifiers, which naive hex arithmetic gets wrong. Both
scroll the page first so lazily revealed sections are actually measured. All
three exit non-zero on failure.

---

## Design

The layout is modelled on **hotelgrandparagon.com**, band for band:

| Reference | Here |
| --- | --- |
| Utility strip, centred logo, split navigation, amber "book now" | Same, with the supplied lockup centred and a gold booking chip |
| Full-bleed hero slider, centred serif headline | `HeroSlider` — four resort photographs, arrows, dots, Ken Burns |
| Check-in / check-out / guests bar over the hero's lower edge | `AvailabilityBar`, which hands the dates to the enquiry form |
| Blush welcome band, photograph in a cusped arch | `WelcomeBand`; the arch is CSS (`.arch-frame`), not a bitmap |
| Alternating image/copy bands with centred text | `FeatureBand` × 4 — rooms, at a glance, terrace, restaurant |
| Pale centred statement between bands | `QuoteBand` |
| Full-bleed banquet plate under a colour wash | `CelebrationsBand` |
| Half photograph, half 2×2 icon cards | `FacilitiesPanel` |
| Three-column amenities grid on cream | `AmenitiesGrid` |
| "Call us 24×7" band with ornaments either side | `CallBand` |
| Newsletter strip | `NewsletterBand` |
| Three-column footer with "important links" and "our location" | `SiteFooter` |

The reference's wide "video" plate becomes `PanoramaBand`, carrying the
1920×700 stitch of the entrance rather than pretending there is a film.

### Palette

The reference is blush pink and sage over gold. The same three-part
structure is rebuilt here out of the company logo, so the page reads as this
resort rather than a recolour of somebody else's:

| Token | Hex | Role |
| --- | --- | --- |
| `green` | `#0E7A46` | The three peaks in the logo — icons, accents |
| `green-deep` | `#0A5734` | Headings on tinted grounds |
| `green-ink` | `#08402A` | Footer, utility strip, photograph scrims |
| `wine` | `#7B1B36` | The wordmark — primary buttons, prices, links |
| `gold` | `#B08A4A` | Ornament rules, the booking chip |
| `blush` `#FBF1F2` · `mint` `#E7F1EA` · `cream` `#F8F1E6` | | Section grounds |

Two tones are **derived** for type, because the mid gold is only 3.7–4.2:1
and 11px small caps need 4.5: `gold-deep` (`#7A5C29`) on the light grounds
and `gold-light` (`#D6B678`) on the green ones. Every page is verified by
`scripts/contrast.mjs`, which measures *rendered* colour.

### Type

*Cormorant Garamond* for display — the closest free equivalent of the
reference's high-contrast old-style serif — *Inter Tight* for body, and
*Parisienne* as a signature script, used only on standalone lines and single
accent words. Tokens are defined once in `src/app/globals.css`.

The three-peak silhouette from the logo recurs as a structural device:
ornament dividers, list bullets, empty media frames, the footer lockup and
the favicon.

### Motion

`<Reveal>` fades and lifts sections in on scroll (one IntersectionObserver
per element, disconnected after it fires), `<Parallax>` drifts images within
their frames, the hero slide pushes slowly while it is active, and the
nearby-towns band runs two counter-scrolling rows. All of it is disabled
under `prefers-reduced-motion`, and the hidden state is applied only once
JavaScript has run, so content is never stuck invisible.

---

## Photography

The resort's photographs ship with the repository under `public/media/`, so
the site has real imagery on a fresh clone — before Supabase exists and
before anyone signs in to `/admin`.

`src/lib/media-library.ts` maps them to **slots** (`heroValley`, `welcome`,
`roomLuxury`, …) rather than to file names, so changing which photograph
fills a slot is a one-line edit instead of a change in six components.
`supabase/seed.sql` registers the same files as `media` rows, links them to
the rooms, dining items and gallery, and sets the welcome plate — all
guarded, so re-running it never replaces a picture chosen in the admin
panel.

Nothing in the read path distinguishes a bundled photograph from an upload:
both arrive as a `Media` row, so the owner can re-point any slot at their
own file and these simply stop being referenced.

### Photographs of the attractions

The eleven places on `/attractions` are public landmarks, not the resort's
property, so **no photograph of them ships with the repository**. Each row
resolves its picture in this order:

1. an image attached to the row in **/admin** — always wins;
2. a file named `<slug>.jpg` in `public/media/attractions/`;
3. otherwise a labelled placeholder plate carrying the distance, so the row
   is still useful and does not look broken.

To fill option 2 in one command:

```bash
node scripts/fetch-attraction-photos.mjs
npm run build          # a statically rendered page reads the directory at build time
```

It pulls one freely licensed photograph per attraction from Wikimedia and
writes `public/media/attractions/credits.json` alongside them. **Keep that
file** — CC-BY and CC-BY-SA require crediting the photographer, and the page
renders the credit underneath each photograph from it. The script refuses to
write any file whose licence it could not confirm.

Replacing any of them with the resort's own photograph is just an upload in
the admin panel, which takes precedence and needs no credit line.

## Content accuracy

`supabase/seed.sql` was transcribed from the live site. Two things were
deliberately left blank rather than guessed:

- **Nightly room rates.** The five room names on the live site could not be
  reliably matched to the rates shown on third-party listings, so rooms show
  "Rates on request" until real rates are entered in the admin panel.
- **Social media links.** No profile URLs were confirmed, so the icons stay
  hidden until they are filled in under Settings.

The postcode also appears as both 173211 and 173229 across listings, so the
seeded address omits it — worth confirming and adding under Settings.
