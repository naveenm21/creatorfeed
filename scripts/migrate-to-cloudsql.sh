#!/usr/bin/env bash
# One-shot migration: Supabase (public schema + Google identities) -> Cloud SQL.
#
# Usage: scripts/migrate-to-cloudsql.sh [--reset]
#   --reset   drop existing CreatorFeed tables in the target before loading
#
# Reads SUPABASE_DB_URL and CLOUDSQL_DB_URL from .env.local (values are never echoed).
# Requires psql/pg_dump >= 17 (brew libpq: /opt/homebrew/opt/libpq/bin).
set -euo pipefail

cd "$(dirname "$0")/.."
export PATH="/opt/homebrew/opt/libpq/bin:$PATH"

env_get() { grep -E "^$1=" .env.local | head -1 | cut -d= -f2-; }
SRC="$(env_get SUPABASE_DB_URL)"
DST="$(env_get CLOUDSQL_DB_URL)"
[[ -n "$SRC" && -n "$DST" ]] || { echo "SUPABASE_DB_URL and CLOUDSQL_DB_URL must be set in .env.local"; exit 1; }
[[ "$DST" != *"<"* ]] || { echo "CLOUDSQL_DB_URL still contains a <placeholder>"; exit 1; }

TABLES=(users threads agent_responses human_replies intake_questions verdicts subscribers community_reactions auth_accounts)
# Source (Supabase) is strictly read-only. The Supabase pooler ignores PGOPTIONS, so the
# setting is applied with SET inside each session before the real command runs.
# (pg_dump always runs in a READ ONLY transaction by itself.)
psrc() { psql "$SRC" -X -q -v ON_ERROR_STOP=1 -c "SET default_transaction_read_only = on" "$@"; }
pdst() { psql "$DST" -X -v ON_ERROR_STOP=1 "$@"; }

echo "==> Checking connections"
psrc -Atc "select 'source: '||version()"
pdst -Atc "select 'target: '||version()"

existing=$(pdst -Atc "select count(*) from pg_tables where schemaname='public' and tablename in ('threads','users','auth_accounts')")
if [[ "$existing" != "0" ]]; then
  if [[ "${1:-}" == "--reset" ]]; then
    echo "==> --reset: dropping existing tables and functions in target"
    pdst -q <<'SQL'
DROP TABLE IF EXISTS auth_accounts, community_reactions, verdicts, intake_questions,
  human_replies, agent_responses, subscribers, threads, users CASCADE;
DROP FUNCTION IF EXISTS increment_views(uuid), update_updated_at_column(),
  match_threads(vector, double precision, integer, uuid);
SQL
  else
    echo "Target already has CreatorFeed tables. Re-run with --reset to replace them."; exit 1
  fi
fi

echo "==> Creating schema"
pdst -q -f db/schema.sql

echo "==> Copying data (public schema)"
pg_dump "$SRC" --data-only --schema=public --no-owner --no-privileges \
  | pdst -q

echo "==> Copying Google identities -> auth_accounts"
psrc -c "\copy (select i.provider, i.provider_id, i.user_id, i.created_at from auth.identities i join public.users u on u.id = i.user_id) to stdout" \
  | pdst -c "\copy auth_accounts(provider, provider_account_id, user_id, created_at) from stdin"

echo "==> Verifying row counts (source vs target)"
fail=0
for t in "${TABLES[@]}"; do
  if [[ "$t" == auth_accounts ]]; then
    s=$(psrc -Atc "select count(*) from auth.identities i join public.users u on u.id = i.user_id")
  else
    s=$(psrc -Atc "select count(*) from public.$t")
  fi
  d=$(pdst -Atc "select count(*) from public.$t")
  mark="ok"; [[ "$s" == "$d" ]] || { mark="MISMATCH"; fail=1; }
  printf "  %-20s %8s %8s  %s\n" "$t" "$s" "$d" "$mark"
done

echo "==> Sanity: vector search on target"
pdst -Atc "select count(*) || ' threads with embeddings' from threads where embedding is not null"
pdst -Atc "select count(*) || ' similar threads found' from match_threads((select embedding from threads where embedding is not null limit 1), 0.3, 5, gen_random_uuid())"

pdst -qc "ANALYZE"
[[ $fail == 0 ]] && echo "==> Migration complete" || { echo "==> Row count mismatch, see above"; exit 1; }
