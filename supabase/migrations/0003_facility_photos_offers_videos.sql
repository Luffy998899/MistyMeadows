-- =====================================================================
-- Misty Meadows Resorts — facility photographs, offer announcements,
-- and videos.
--
-- A separate migration so a project that has already run 0001 and 0002
-- can pick this up by running one more file. Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Facilities can carry a photograph
--
-- Without this the admin panel had no way to put a picture on a facility,
-- so the cards on the home page could only ever be an icon and a line of
-- text. `add column if not exists` keeps the file re-runnable.
-- ---------------------------------------------------------------------

alter table public.facilities
  add column if not exists image_id uuid references public.media(id) on delete set null;

-- ---------------------------------------------------------------------
-- Offers can announce themselves
--
-- `announce` puts the offer in a dismissible panel that opens over the
-- site shortly after the page loads. `announce_version` is what makes
-- "dismissed" behave: the browser remembers the version it closed, so
-- editing the offer and bumping this brings the panel back for everyone
-- who had already dismissed the previous wording — without it, a guest
-- who closed the panel in January would never see the summer offer.
-- ---------------------------------------------------------------------

alter table public.offers
  add column if not exists announce boolean not null default false;

alter table public.offers
  add column if not exists announce_version integer not null default 1;

-- ---------------------------------------------------------------------
-- Videos
--
-- Either an uploaded file (media.kind = 'video') or an embed URL from
-- YouTube or Vimeo. Both are supported because a phone video of the
-- terrace wants uploading, while a professionally shot film is usually
-- already on YouTube and should not be paid for twice in bandwidth.
--
-- `poster_id` is the still shown before playback starts. For an embed it
-- is optional (the provider supplies its own thumbnail); for an upload it
-- is worth setting, because a browser showing the first frame of a video
-- usually shows something dark and meaningless.
-- ---------------------------------------------------------------------

create table if not exists public.videos (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null default '',
  -- Where it plays: the home page band, the gallery page, or both.
  placement   text not null default 'gallery'
                check (placement in ('home', 'gallery', 'both')),
  media_id    uuid references public.media(id) on delete set null,
  embed_url   text,
  poster_id   uuid references public.media(id) on delete set null,
  sort_order  integer not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- A row with neither a file nor a link has nothing to play.
  constraint videos_have_a_source check (media_id is not null or embed_url is not null)
);

drop trigger if exists videos_touch on public.videos;
create trigger videos_touch
  before update on public.videos
  for each row execute function public.touch_updated_at();

alter table public.videos enable row level security;

drop policy if exists videos_public_read on public.videos;
create policy videos_public_read on public.videos
  for select using (published or public.is_admin());

drop policy if exists videos_admin_write on public.videos;
create policy videos_admin_write on public.videos
  for all using (public.is_admin()) with check (public.is_admin());
