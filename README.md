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
| Rooms & suites | Room types, rates, GST %, features, photographs and video |
| Long-stay apartments | Monthly-let inventory and rates |
| Facilities & benefits | On-site facilities, and the "booking direct" points |
| Dining | Thalis, picnic packages, prices |
| Testimonials | Guest reviews and star ratings |
| Gallery | Photographs, grouped by category |
| Offers | Seasonal packages with validity dates |
| News & events | Posts, with optional future publish dates |
| Enquiries | Every website enquiry, with status and CSV export |
| Settings | Address, phones, emails, social links, logo, hero image, SMTP |

**There is no hardcoded photography anywhere.** Every image is uploaded
through the admin panel into Supabase Storage. Until something is uploaded,
the layout shows a quiet placeholder plate rather than a broken frame, so the
site is presentable from day one.

---

## Setup

### 1. Create the Supabase project

At [supabase.com](https://supabase.com), create a project, then open
**SQL Editor** and run, in this order:

1. `supabase/migrations/0001_init.sql` — tables, row level security,
   storage bucket
2. `supabase/migrations/0004_room_video_and_gst.sql` — room videos, GST rates
3. `supabase/seed.sql` — the real resort content transcribed from the
   existing website (rooms, apartments, dining rates, testimonials, address)

All three are safe to re-run: nothing is duplicated, and the seed will
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
in `src/lib/fallback-content.ts` — the same content as `seed.sql`. This makes
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
node --experimental-strip-types scripts/pricing.test.mts  # GST arithmetic
```

`screenshot.mjs` writes to `.screenshots/` and reports horizontal overflow,
failed requests and console errors. `contrast.mjs` measures *rendered* colour
against AA — it parses via canvas, so it handles the `oklab()` values Tailwind
emits for opacity modifiers, which naive hex arithmetic gets wrong. Both
scroll the page first so lazily revealed sections are actually measured. All
three exit non-zero on failure.

---

## Rates and GST

The owner enters the **pre-tax** tariff plus a **GST %**, and the site does
the arithmetic — `₹4,000` at `12` is published as `₹4,480`, with
`₹4,000 + tax` shown underneath. Leave GST blank and the base rate is shown
with "+ applicable taxes" instead.

GST is deliberately not pre-filled with 12 or 18: the applicable slab depends
on the tariff and on current rules, so the rate is the owner's to set.
`scripts/pricing.test.mts` covers the arithmetic, including lakh-style digit
grouping (`₹12,50,000`, not `₹1,250,000`).

---

## The map

The About page map needs no API key and no configuration — it is built from
the postal address in Settings. The "Google Maps embed URL" field is optional
and only overrides that when it holds a genuine Google Maps URL; a pasted
`<iframe>` snippet is unwrapped automatically, and anything else is ignored
rather than rendered. That last part matters: a relative or same-origin value
resolves against this site and renders its 404 page inside the map frame.

---

## Deploying

```bash
./deploy.sh
```

It asks for a domain. **Leave it blank and the site just runs locally** on
`http://localhost:3000` — nothing is published and no certificate is
requested. Give it a domain and it installs nginx, registers a systemd
service, and obtains a Let's Encrypt certificate through certbot with
automatic renewal and an HTTP→HTTPS redirect.

```bash
./deploy.sh --dry-run                      # report the mode, change nothing
./deploy.sh --local --port 8080            # local, no prompt
./deploy.sh --domain example.com --email you@example.com
./deploy.sh --domain example.com --staging # test certs, avoids rate limits
```

Point the domain's A record at the server *before* running it with a domain —
certbot's HTTP challenge cannot succeed otherwise. The script checks DNS and
warns you first. `www` is added to the certificate only when it resolves.

---

## Design

### Palette

Built on the five supplied swatches, used verbatim:

| Token | Hex | Role |
| --- | --- | --- |
| `ink` / `umber` | `#3E362E` | Body text, dark section ground |
| `bark` | `#865D36` | Emphasis, prices, links, the logo mark |
| `clay` | `#93785B` | Rules and icons only — 3.6:1, below AA for text |
| `tan` | `#AC8968` | Section ground |
| `greige` | `#A69080` | Supporting tone |

Three tones are **derived**, because the supplied set has no light ground and
nothing dark enough for small text on the mid browns: `paper` (`#F4EDE4`),
`umber-deep` (`#2B241E`) and `stone` (`#6B5A47`).

Sections alternate paper → umber → paper → almond → paper → tan → paper →
umber, so the page has vertical rhythm rather than running cream throughout.
Because the mid-brown grounds are light, `.on-almond` and `.on-tan` re-scope
muted text to `umber-deep` — the default muted tone only reaches ~2.4:1 there.

### Type

*Fraunces* for display (SOFT and WONK axes give it a hand), *Inter Tight* for
body, and *Parisienne* as a signature script — used only for standalone lines
and a single accent word inside a heading, never for running text. Tokens are
defined once in `src/app/globals.css`.

The three-peak silhouette from the logo recurs as a structural device: section
rules, list bullets, empty media frames and the favicon.

### Motion

`<Reveal>` fades and lifts sections in on scroll (one IntersectionObserver per
element, disconnected after it fires), `<Parallax>` drifts images within their
frames, and the nearby-towns band runs two counter-scrolling rows. All of it
is disabled under `prefers-reduced-motion`, and the hidden state is applied
only once JavaScript has run, so content is never stuck invisible.

---

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
