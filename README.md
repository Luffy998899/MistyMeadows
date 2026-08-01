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
**SQL Editor** and run, in order:

1. `supabase/migrations/0001_init.sql` — tables, row level security,
   storage bucket
2. `supabase/seed.sql` — the real resort content transcribed from the
   existing website (rooms, apartments, dining rates, testimonials, address)

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

### Checking responsive behaviour

With a server running on port 3210:

```bash
node scripts/screenshot.mjs /rooms rooms 1440,768,375
```

Writes to `.screenshots/` and reports horizontal overflow, failed requests and
console errors. Exits non-zero if anything is wrong.

---

## Design

Palette and type are derived from the company logo — the three nested peaks
are forest green (`#157a4c`), the wordmark burgundy (`#7b1e32`), set on a warm
paper neutral so the photography carries the colour. Display face is
*Fraunces* (its SOFT and WONK axes are used on signature lines), body is
*Inter Tight*. Tokens are defined once in `src/app/globals.css`.

The peak silhouette recurs as a structural device: section rules, list
bullets, empty media frames and the favicon.

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
