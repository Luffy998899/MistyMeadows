#!/usr/bin/env bash
#
# Runs supabase/migrations + supabase/seed.sql against a throwaway local
# Postgres and asserts:
#
#   1. the migration applies cleanly to an empty database
#   2. the seed applies cleanly
#   3. both are idempotent — re-running changes no row counts
#   4. the seed never overwrites content edited in the admin panel
#   5. row level security behaves correctly for anon / user / admin
#
# Requires a local PostgreSQL server binary. Nothing here touches a real
# Supabase project.
#
#   ./scripts/verify-sql.sh
#
set -euo pipefail

PGBIN=${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | tail -1)}
PORT=${PGPORT:-55433}
PGDATA=${PGDATA:-/var/lib/postgresql/mm-verify}
SOCK=/tmp
DB=mm_verify

export PATH="$PGBIN:$PATH"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

as_pg() { if [ "$(id -u)" = "0" ]; then su postgres -c "PATH=$PGBIN:\$PATH $*"; else eval "$*"; fi }
psql_db() { psql -h "$SOCK" -p "$PORT" -U postgres -d "$1" -v ON_ERROR_STOP=1 "${@:2}"; }

# Applying an idempotent migration twice emits a wall of "already exists,
# skipping" notices. Errors still surface; only the noise is suppressed.
psql_quiet() { psql_db "$1" -q -c "set client_min_messages = warning;" -f "$2"; }

cleanup() { as_pg "pg_ctl -D $PGDATA -m immediate stop" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "→ starting a throwaway Postgres on port $PORT"
rm -rf "$PGDATA"; mkdir -p "$PGDATA"
[ "$(id -u)" = "0" ] && chown -R postgres "$PGDATA"
as_pg "initdb -D $PGDATA -A trust -U postgres" >/dev/null
as_pg "pg_ctl -D $PGDATA -o '-p $PORT -k $SOCK' -l /tmp/mm-verify.log start" >/dev/null
sleep 2

psql -h "$SOCK" -p "$PORT" -U postgres -q -c "create database $DB;"

counts() {
  psql -h "$SOCK" -p "$PORT" -U postgres -d "$DB" -At -c \
    "select (select count(*) from rooms)||'/'||(select count(*) from apartments)
          ||'/'||(select count(*) from facilities)||'/'||(select count(*) from dining_items)
          ||'/'||(select count(*) from testimonials)
          ||'/'||(select count(*) from media)||'/'||(select count(*) from gallery_items)
          ||'/'||(select count(*) from attractions);"
}

echo "→ applying stub, migration and seed"
psql_quiet "$DB" "$ROOT/supabase/verify/00-supabase-stub.sql"
for m in "$ROOT"/supabase/migrations/*.sql; do psql_quiet "$DB" "$m"; done
psql_quiet "$DB" "$ROOT/supabase/seed.sql"
FIRST=$(counts)
echo "   rooms/apartments/facilities/dining/testimonials/media/gallery/attractions = $FIRST"

echo "→ re-applying to check idempotency"
for m in "$ROOT"/supabase/migrations/*.sql; do psql_quiet "$DB" "$m"; done
psql_quiet "$DB" "$ROOT/supabase/seed.sql"
SECOND=$(counts)

if [ "$FIRST" != "$SECOND" ]; then
  echo "   FAIL: re-running changed row counts ($FIRST → $SECOND)"
  exit 1
fi
echo "   PASS: row counts unchanged ($SECOND)"

UNLINKED=$(psql -h "$SOCK" -p "$PORT" -U postgres -d "$DB" -At -c \
  "select count(*) from rooms where image_id is null;")
if [ "$UNLINKED" != "0" ]; then
  echo "   FAIL: $UNLINKED room(s) have no photograph attached"
  exit 1
fi
echo "   PASS: every room has a photograph"

echo "→ checking the seed does not overwrite admin-panel edits"
psql_db "$DB" -q -c "update rooms set summary = 'OWNER EDITED' where slug = 'luxury-room';"
psql_quiet "$DB" "$ROOT/supabase/seed.sql"
KEPT=$(psql -h "$SOCK" -p "$PORT" -U postgres -d "$DB" -At -c \
  "select summary from rooms where slug = 'luxury-room';")

if [ "$KEPT" != "OWNER EDITED" ]; then
  echo "   FAIL: seed overwrote an edited row (got '$KEPT')"
  exit 1
fi
echo "   PASS: edited content survived"

echo "→ checking row level security"
psql_db "$DB" -f "$ROOT/supabase/verify/01-rls-test.sql" 2>&1 |
  grep -E "PASS|FAIL|ERROR" | sed 's/^NOTICE:  /   /' | sed 's/^/   /'

echo
echo "All SQL checks passed."
