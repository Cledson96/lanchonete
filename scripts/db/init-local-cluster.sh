#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
. "$SCRIPT_DIR/common.sh"

require_postgres_install
require_command openssl

ensure_runtime_dirs

if [ ! -f "$LANCHONETE_PG_DATA_DIR/PG_VERSION" ]; then
  "$LANCHONETE_PG_BIN_DIR/initdb" -D "$LANCHONETE_PG_DATA_DIR" --encoding=UTF8 --locale=C.UTF-8 >/dev/null
fi

ensure_host_password_auth
start_server
reload_server

if [ -f "$LANCHONETE_PG_PASSWORD_FILE" ]; then
  APP_PASSWORD="$(app_password)"
else
  APP_PASSWORD="$(openssl rand -hex 16)"
  printf '%s' "$APP_PASSWORD" > "$LANCHONETE_PG_PASSWORD_FILE"
  chmod 600 "$LANCHONETE_PG_PASSWORD_FILE"
fi

ROLE_EXISTS="$(superuser_psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${LANCHONETE_PG_APP_USER}'" | tr -d '[:space:]')"

if [ "$ROLE_EXISTS" = "1" ]; then
  superuser_psql -c "ALTER ROLE ${LANCHONETE_PG_APP_USER} WITH LOGIN PASSWORD '${APP_PASSWORD}' CREATEDB"
else
  superuser_psql -c "CREATE ROLE ${LANCHONETE_PG_APP_USER} LOGIN PASSWORD '${APP_PASSWORD}' CREATEDB"
fi

if ! superuser_psql -tAc "SELECT 1 FROM pg_database WHERE datname='${LANCHONETE_PG_DEV_DB}'" | grep -q 1; then
  superuser_psql -c "CREATE DATABASE ${LANCHONETE_PG_DEV_DB} OWNER ${LANCHONETE_PG_APP_USER}"
else
  superuser_psql -c "ALTER DATABASE ${LANCHONETE_PG_DEV_DB} OWNER TO ${LANCHONETE_PG_APP_USER}"
fi

printf 'Banco local pronto em 127.0.0.1:%s\n' "$LANCHONETE_PG_PORT"
printf 'Senha do usuario da aplicacao salva em %s\n' "$LANCHONETE_PG_PASSWORD_FILE"
printf 'Prisma pode usar shadow database temporario automaticamente porque %s tem CREATEDB.\n' "$LANCHONETE_PG_APP_USER"
printf 'Use ./scripts/db/print-env.sh > .env.local para gerar as variaveis locais.\n'
