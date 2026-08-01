-- Asserts that row level security actually behaves as intended, for each
-- of the three roles a request can arrive as.
--
-- Each role block runs inside one transaction: set_config(..., true) is
-- transaction-local, so without BEGIN the impersonated JWT claim would be
-- discarded before the next statement and every check would silently read
-- as "not signed in".

\set ON_ERROR_STOP on

-- Grants Supabase applies by default, so `set role` reflects production.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'random@example.com')
on conflict do nothing;

insert into public.admin_users (user_id, email, full_name)
values ('11111111-1111-1111-1111-111111111111', 'owner@example.com', 'Owner')
on conflict do nothing;

-- An unpublished row, to prove drafts stay private.
insert into public.rooms (slug, name, published) values ('draft-room', 'Draft Room', false)
on conflict (slug) do nothing;

create or replace function pg_temp.assert(label text, got anyelement, want anyelement)
returns void language plpgsql as $$
begin
  if got is distinct from want then
    raise exception 'FAIL % — expected %, got %', label, want, got;
  end if;
  raise notice 'PASS %', label;
end $$;

-- ---------------------------------------------------------------- anon
begin;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);

select pg_temp.assert('anon: is_admin is false', public.is_admin(), false);
select pg_temp.assert('anon: cannot see drafts',
  (select count(*) from rooms where slug = 'draft-room'), 0::bigint);
select pg_temp.assert('anon: cannot read enquiries',
  (select count(*) from enquiries), 0::bigint);
select pg_temp.assert('anon: cannot read SMTP credentials',
  (select count(*) from secure_settings), 0::bigint);

-- Submitting an enquiry must work.
insert into enquiries (name, email, message) values ('Visitor', 'v@example.com', 'hello');

do $$
begin
  insert into rooms (slug, name) values ('anon-write', 'Nope');
  raise exception 'FAIL anon: was able to write content';
exception when insufficient_privilege then
  raise notice 'PASS anon: blocked from writing content';
end $$;
commit;

-- ------------------------------------------- signed in, but not an admin
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

select pg_temp.assert('non-admin: is_admin is false', public.is_admin(), false);
select pg_temp.assert('non-admin: cannot see drafts',
  (select count(*) from rooms where slug = 'draft-room'), 0::bigint);
select pg_temp.assert('non-admin: cannot read enquiries',
  (select count(*) from enquiries), 0::bigint);

do $$
begin
  insert into rooms (slug, name) values ('user-write', 'Nope');
  raise exception 'FAIL non-admin: was able to write content';
exception when insufficient_privilege then
  raise notice 'PASS non-admin: blocked from writing content';
end $$;
commit;

-- --------------------------------------------------------------- admin
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select pg_temp.assert('admin: is_admin is true', public.is_admin(), true);
select pg_temp.assert('admin: sees drafts',
  (select count(*) from rooms where slug = 'draft-room'), 1::bigint);
select pg_temp.assert('admin: reads enquiries',
  (select count(*) from enquiries), 1::bigint);

insert into rooms (slug, name) values ('admin-write', 'Admin Made')
on conflict (slug) do nothing;

-- SMTP credentials are service-role only: even an admin session is denied.
select pg_temp.assert('admin: still cannot read SMTP credentials',
  (select count(*) from secure_settings), 0::bigint);
commit;

-- ------------------------------------------------------------- triggers
update rooms set name = 'Renamed' where slug = 'admin-write';
select pg_temp.assert('updated_at trigger fires',
  (select updated_at > created_at from rooms where slug = 'admin-write'), true);
