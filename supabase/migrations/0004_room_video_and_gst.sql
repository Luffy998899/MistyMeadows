-- =====================================================================
-- Room walkthrough videos, and GST handled by the site rather than by
-- hand.
--
-- Safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Room video
--
-- Separate from image_id so a room can have both a still and a
-- walkthrough. Points at the same media library, which already accepts
-- mp4/webm uploads.
-- ---------------------------------------------------------------------

alter table public.rooms
  add column if not exists video_id uuid references public.media(id) on delete set null;

-- ---------------------------------------------------------------------
-- GST
--
-- `rate_inr` stays the pre-tax tariff — it is what the owner is quoted
-- and what they type in. `gst_percent` is the rate to apply, and the
-- site does the arithmetic for display.
--
-- Deliberately NULL by default rather than pre-set to 12 or 18: the
-- applicable slab depends on the tariff and on current rules, and
-- publishing a tax rate nobody chose would be worse than showing
-- "+ applicable taxes" until it is filled in.
-- ---------------------------------------------------------------------

alter table public.rooms
  add column if not exists gst_percent numeric(5,2)
    check (gst_percent is null or (gst_percent >= 0 and gst_percent <= 100));

alter table public.apartments
  add column if not exists gst_percent numeric(5,2)
    check (gst_percent is null or (gst_percent >= 0 and gst_percent <= 100));

comment on column public.rooms.rate_inr is
  'Nightly tariff BEFORE GST. The site adds gst_percent for display.';
comment on column public.rooms.gst_percent is
  'GST rate to apply to rate_inr, e.g. 12 or 18. NULL shows "+ applicable taxes".';
comment on column public.apartments.rate_monthly_inr is
  'Monthly rent BEFORE GST. The site adds gst_percent for display.';
