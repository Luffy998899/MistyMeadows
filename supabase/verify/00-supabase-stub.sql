-- Minimal stand-ins for the parts Supabase provides (auth + storage), so
-- the real migration can be executed and tested against a plain Postgres.
-- Never run this against a real Supabase project — it is for local
-- verification only.

do $$ begin create role anon nologin;          exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin;  exception when duplicate_object then null; end $$;

create schema if not exists auth;
create schema if not exists storage;

create table if not exists auth.users (
  id    uuid primary key default gen_random_uuid(),
  email text
);

-- PostgREST sets this claim per request; mirroring that lets the tests
-- impersonate a signed-in user.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

create table if not exists storage.buckets (
  id              text primary key,
  name            text not null,
  public          boolean not null default false,
  file_size_limit bigint
);

create table if not exists storage.objects (
  id        uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets(id),
  name      text
);

alter table storage.objects enable row level security;
