-- =====================================================================
-- Misty Meadows Resorts — attractions
--
-- What there is to see within a morning's drive of Kumarhatti, shown on
-- /attractions and managed from /admin like every other content type.
--
-- A separate migration rather than an edit to 0001 so that a project
-- which has already run the initial schema can pick this up by running
-- one more file. Like 0001 it is safe to re-run.
-- =====================================================================

create table if not exists public.attractions (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  -- "Colonial history", "Temples", "Railway heritage" … shown as the
  -- eyebrow above the name, and used to group the page's filter chips.
  category      text not null default 'Nearby',
  -- Free text, not a number: road distance and drive time vary by route
  -- and season, and the owner is the one who actually knows. Editable in
  -- the admin panel without a developer.
  distance_note text not null default '',
  summary       text not null default '',
  description   text not null default '',
  -- Opening hours, entry notes, "closed on Mondays" — anything a guest
  -- should know before setting off.
  visit_note    text,
  highlights    text[] not null default '{}',
  map_url       text,
  image_id      uuid references public.media(id) on delete set null,
  sort_order    integer not null default 0,
  published     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists attractions_touch on public.attractions;
create trigger attractions_touch
  before update on public.attractions
  for each row execute function public.touch_updated_at();

-- Same rule as the other content tables: published rows are world
-- readable, admins additionally see drafts and may write. The check runs
-- in the database, so it holds even if application code is wrong.
alter table public.attractions enable row level security;

drop policy if exists attractions_public_read on public.attractions;
create policy attractions_public_read on public.attractions
  for select using (published or public.is_admin());

drop policy if exists attractions_admin_write on public.attractions;
create policy attractions_admin_write on public.attractions
  for all using (public.is_admin()) with check (public.is_admin());
