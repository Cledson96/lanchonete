#!/usr/bin/env bash
set -euo pipefail

SOURCE_ENV="${SOURCE_ENV:-.env.local}"
TARGET_ENV="${TARGET_ENV:-.env.dev}"

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "command not found: $1"
}

read_database_url() {
  local env_file="$1"
  local line value

  [ -f "$env_file" ] || die "env file not found: $env_file"

  line="$(grep -E '^[[:space:]]*(export[[:space:]]+)?DATABASE_URL=' "$env_file" | tail -n 1 || true)"
  [ -n "$line" ] || die "DATABASE_URL not found in $env_file"

  line="${line#export }"
  value="${line#*=}"
  value="${value#\"}"
  value="${value%\"}"
  value="${value#\'}"
  value="${value%\'}"

  printf '%s' "$value"
}

require_command pg_dump
require_command pg_restore
require_command psql

SOURCE_DATABASE_URL="$(read_database_url "$SOURCE_ENV")"
TARGET_DATABASE_URL="$(read_database_url "$TARGET_ENV")"

[ "$SOURCE_DATABASE_URL" != "$TARGET_DATABASE_URL" ] || die "source and target DATABASE_URL are the same"

if [ "${ALLOW_NON_DEV_TARGET:-0}" != "1" ] && [[ ! "$TARGET_ENV $TARGET_DATABASE_URL" =~ dev|develop|development ]]; then
  die "refusing to overwrite a target that does not look like development. Set ALLOW_NON_DEV_TARGET=1 to override."
fi

cat <<MSG
This will copy data from SOURCE_ENV=$SOURCE_ENV to TARGET_ENV=$TARGET_ENV.
The target database schema public will be dropped and recreated.

No DATABASE_URL values are printed by this script.
MSG

if [ "${CONFIRM_COPY_PROD_TO_DEVELOP:-0}" != "1" ]; then
  die "set CONFIRM_COPY_PROD_TO_DEVELOP=1 to run this destructive operation"
fi

dump_file="$(mktemp -t lanchonete-prod-to-develop.XXXXXX.dump)"
cleanup() {
  rm -f "$dump_file"
}
trap cleanup EXIT

printf 'Creating production dump...\n'
pg_dump \
  --dbname "$SOURCE_DATABASE_URL" \
  --format custom \
  --no-owner \
  --no-acl \
  --file "$dump_file"

printf 'Resetting development schema...\n'
psql "$TARGET_DATABASE_URL" \
  --set ON_ERROR_STOP=1 \
  --command 'DROP SCHEMA IF EXISTS public CASCADE;' \
  --command 'CREATE SCHEMA public;'

printf 'Restoring dump into development...\n'
pg_restore \
  --dbname "$TARGET_DATABASE_URL" \
  --no-owner \
  --no-acl \
  --exit-on-error \
  "$dump_file"

printf 'Done. Development database now has the production data snapshot.\n'
