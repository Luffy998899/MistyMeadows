-- =====================================================================
-- Misty Meadows Resorts — initial schema
--
-- Design notes:
--  * Every piece of front-of-site content lives here, so the owner can
--    change the whole website from /admin without a redeploy.
--  * `site_settings` is publicly readable (phone numbers, socials, address).
--    `secure_settings` holds SMTP credentials and is service-role only —
--    no anon or authenticated role can read it, even an admin's browser
--    session. It is written by server actions after an admin check.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------

-- SECURITY DEFINER so policies can call it without recursing into
-- admin_users' own RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Admin allowlist
-- ---------------------------------------------------------------------

create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Media library — every image/video the owner uploads
-- ---------------------------------------------------------------------

create table if not exists public.media (
  id          uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  public_url  text not null,
  kind        text not null default 'image' check (kind in ('image', 'video')),
  alt         text not null default '',
  title       text,
  width       int,
  height      int,
  size_bytes  bigint,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------

create table if not exists public.rooms (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name         text not null,
  summary      text not null default '',
  description  text not null default '',
  rate_inr     integer,
  rate_note    text default 'per night + applicable taxes',
  max_guests   integer not null default 2,
  size_note    text,
  features     text[] not null default '{}',
  image_id     uuid references public.media(id) on delete set null,
  gallery_ids  uuid[] not null default '{}',
  sort_order   integer not null default 0,
  published    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Long-stay inventory, priced monthly rather than nightly.
create table if not exists public.apartments (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  block         text,
  detail        text not null default '',
  rate_monthly_inr integer,
  image_id      uuid references public.media(id) on delete set null,
  sort_order    integer not null default 0,
  published     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- `category` splits the on-site amenities from the "why book direct" row,
-- so the owner edits both from one screen without needing two tables.
create table if not exists public.facilities (
  id          uuid primary key default gen_random_uuid(),
  category    text not null default 'facility'
                check (category in ('facility', 'booking_benefit')),
  name        text not null,
  description text not null default '',
  icon        text not null default 'peak',
  sort_order  integer not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.dining_items (
  id          uuid primary key default gen_random_uuid(),
  category    text not null default 'thali',
  name        text not null,
  detail      text not null default '',
  price_note  text,
  image_id    uuid references public.media(id) on delete set null,
  sort_order  integer not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  author      text not null,
  headline    text,
  quote       text not null,
  rating      smallint not null default 5 check (rating between 1 and 5),
  source      text,
  stay_date   text,
  sort_order  integer not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id          uuid primary key default gen_random_uuid(),
  media_id    uuid not null references public.media(id) on delete cascade,
  caption     text not null default '',
  category    text not null default 'Resort',
  sort_order  integer not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.offers (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  summary      text not null default '',
  body         text not null default '',
  terms        text,
  valid_from   date,
  valid_to     date,
  image_id     uuid references public.media(id) on delete set null,
  sort_order   integer not null default 0,
  published    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- News & events
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  category     text not null default 'News',
  excerpt      text not null default '',
  body         text not null default '',
  image_id     uuid references public.media(id) on delete set null,
  event_date   date,
  published_at timestamptz,
  published    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Enquiries & subscribers
-- ---------------------------------------------------------------------

create table if not exists public.enquiries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  check_in    date,
  check_out   date,
  guests      integer,
  room_id     uuid references public.rooms(id) on delete set null,
  room_name   text,
  message     text not null default '',
  status      text not null default 'new' check (status in ('new', 'contacted', 'confirmed', 'closed')),
  admin_note  text,
  source      text not null default 'website',
  mail_sent   boolean not null default false,
  mail_error  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists enquiries_created_idx on public.enquiries (created_at desc);
create index if not exists enquiries_status_idx on public.enquiries (status);

create table if not exists public.subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------

-- Single-row table. The `id` check keeps it that way.
create table if not exists public.site_settings (
  id              boolean primary key default true check (id),
  brand_name      text not null default 'Misty Meadows Resorts',
  legal_name      text not null default 'Misty Meadows Resorts & Hotels Pvt. Ltd.',
  tagline         text not null default 'A hill retreat at 5,800 ft',
  intro           text not null default '',
  address_lines   text[] not null default '{}',
  map_url         text,
  map_embed_url   text,
  phones          text[] not null default '{}',
  whatsapp        text,
  emails          text[] not null default '{}',
  socials         jsonb not null default '{}'::jsonb,
  hero_media_id   uuid references public.media(id) on delete set null,
  hero_video_url  text,
  logo_media_id   uuid references public.media(id) on delete set null,
  copyright_text  text not null default 'Copyright 2021 Misty Meadows Resorts. All Rights Reserved',
  booking_note    text,
  updated_at      timestamptz not null default now()
);

-- SMTP credentials. Deliberately has NO policies: with RLS on and no
-- policy, anon and authenticated are denied outright. Only the service
-- role (server-side) can touch it.
create table if not exists public.secure_settings (
  id             boolean primary key default true check (id),
  smtp_host      text,
  smtp_port      integer default 587,
  smtp_secure    boolean not null default false,
  smtp_user      text,
  smtp_password  text,
  from_name      text default 'Misty Meadows Resorts',
  from_email     text,
  notify_emails  text[] not null default '{}',
  reply_to       text,
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'rooms', 'apartments', 'facilities', 'dining_items', 'testimonials',
    'offers', 'posts', 'enquiries', 'site_settings', 'secure_settings'
  ]
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
         for each row execute function public.touch_updated_at();', t, t);
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------

alter table public.admin_users     enable row level security;
alter table public.media           enable row level security;
alter table public.rooms           enable row level security;
alter table public.apartments      enable row level security;
alter table public.facilities      enable row level security;
alter table public.dining_items    enable row level security;
alter table public.testimonials    enable row level security;
alter table public.gallery_items   enable row level security;
alter table public.offers          enable row level security;
alter table public.posts           enable row level security;
alter table public.enquiries       enable row level security;
alter table public.subscribers     enable row level security;
alter table public.site_settings   enable row level security;
alter table public.secure_settings enable row level security;

-- Admins can see the allowlist; nobody else can.
drop policy if exists admin_users_read on public.admin_users;
create policy admin_users_read on public.admin_users
  for select using (public.is_admin());

-- Published content is world-readable; admins see drafts too and may write.
do $$
declare
  t text;
begin
  foreach t in array array[
    'rooms', 'apartments', 'facilities', 'dining_items',
    'testimonials', 'gallery_items', 'offers'
  ]
  loop
    execute format('drop policy if exists %I_public_read on public.%I;', t, t);
    execute format(
      'create policy %I_public_read on public.%I
         for select using (published or public.is_admin());', t, t);

    execute format('drop policy if exists %I_admin_write on public.%I;', t, t);
    execute format(
      'create policy %I_admin_write on public.%I
         for all using (public.is_admin()) with check (public.is_admin());', t, t);
  end loop;
end;
$$;

-- Posts additionally respect a future publish date.
drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts
  for select using (
    (published and (published_at is null or published_at <= now()))
    or public.is_admin()
  );

drop policy if exists posts_admin_write on public.posts;
create policy posts_admin_write on public.posts
  for all using (public.is_admin()) with check (public.is_admin());

-- Media is readable by anyone (it is served from a public bucket anyway).
drop policy if exists media_public_read on public.media;
create policy media_public_read on public.media for select using (true);

drop policy if exists media_admin_write on public.media;
create policy media_admin_write on public.media
  for all using (public.is_admin()) with check (public.is_admin());

-- Anyone may submit an enquiry; only admins may read or manage them.
drop policy if exists enquiries_public_insert on public.enquiries;
create policy enquiries_public_insert on public.enquiries
  for insert with check (true);

drop policy if exists enquiries_admin_read on public.enquiries;
create policy enquiries_admin_read on public.enquiries
  for select using (public.is_admin());

drop policy if exists enquiries_admin_write on public.enquiries;
create policy enquiries_admin_write on public.enquiries
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists enquiries_admin_delete on public.enquiries;
create policy enquiries_admin_delete on public.enquiries
  for delete using (public.is_admin());

-- Same shape for the newsletter.
drop policy if exists subscribers_public_insert on public.subscribers;
create policy subscribers_public_insert on public.subscribers
  for insert with check (true);

drop policy if exists subscribers_admin_read on public.subscribers;
create policy subscribers_admin_read on public.subscribers
  for select using (public.is_admin());

drop policy if exists subscribers_admin_delete on public.subscribers;
create policy subscribers_admin_delete on public.subscribers
  for delete using (public.is_admin());

-- Site settings: readable by all (it is the header/footer), writable by admins.
drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read on public.site_settings
  for select using (true);

drop policy if exists site_settings_admin_write on public.site_settings;
create policy site_settings_admin_write on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- secure_settings intentionally has no policies → service role only.

-- ---------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 209715200)
on conflict (id) do update set public = true, file_size_limit = 209715200;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "media admin insert" on storage.objects;
create policy "media admin insert" on storage.objects
  for insert with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects
  for update using (bucket_id = 'media' and public.is_admin());

drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects
  for delete using (bucket_id = 'media' and public.is_admin());

-- ---------------------------------------------------------------------
-- Singleton rows
-- ---------------------------------------------------------------------

insert into public.site_settings (id) values (true) on conflict (id) do nothing;
insert into public.secure_settings (id) values (true) on conflict (id) do nothing;
