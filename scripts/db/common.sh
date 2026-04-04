#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"

export LANCHONETE_PG_INSTALL_ROOT="${LANCHONETE_PG_INSTALL_ROOT:-$HOME/.local/opt/postgresql-16}"
export LANCHONETE_PG_BASE_DIR="${LANCHONETE_PG_BASE_DIR:-$HOME/.local/share/lanchonete-postgres}"
export LANCHONETE_PG_CACHE_DIR="${LANCHONETE_PG_CACHE_DIR:-$HOME/.cache/lanchonete-postgres/debs}"
export LANCHONETE_PG_BIN_DIR="$LANCHONETE_PG_INSTALL_ROOT/usr/lib/postgresql/16/bin"
export LANCHONETE_PG_LIB_DIR="$LANCHONETE_PG_INSTALL_ROOT/usr/lib/x86_64-linux-gnu:$LANCHONETE_PG_INSTALL_ROOT/usr/lib/postgresql/16/lib"
export LANCHONETE_PG_DATA_DIR="$LANCHONETE_PG_BASE_DIR/data"
export LANCHONETE_PG_SOCKET_DIR="$LANCHONETE_PG_BASE_DIR/socket"
export LANCHONETE_PG_LOG_FILE="$LANCHONETE_PG_BASE_DIR/postgres.log"
export LANCHONETE_PG_PASSWORD_FILE="$LANCHONETE_PG_BASE_DIR/lanchonete_app.password"
export LANCHONETE_PG_PORT="${LANCHONETE_PG_PORT:-54329}"
export LANCHONETE_PG_APP_USER="${LANCHONETE_PG_APP_USER:-lanchonete_app}"
export LANCHONETE_PG_DEV_DB="${LANCHONETE_PG_DEV_DB:-lanchonete_dev}"
export PATH="$LANCHONETE_PG_BIN_DIR:$PATH"
export LD_LIBRARY_PATH="$LANCHONETE_PG_LIB_DIR${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
export PGHOST="${PGHOST:-$LANCHONETE_PG_SOCKET_DIR}"
export PGPORT="${PGPORT:-$LANCHONETE_PG_PORT}"
export PGUSER="${PGUSER:-$USER}"

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "command not found: $1"
}

require_postgres_install() {
  [ -x "$LANCHONETE_PG_BIN_DIR/psql" ] || die "PostgreSQL local nao instalado. Rode ./scripts/db/install-postgres-local.sh primeiro."
}

ensure_runtime_dirs() {
  mkdir -p "$LANCHONETE_PG_BASE_DIR" "$LANCHONETE_PG_SOCKET_DIR"
}

server_is_running() {
  require_postgres_install
  "$LANCHONETE_PG_BIN_DIR/pg_ctl" -D "$LANCHONETE_PG_DATA_DIR" status >/dev/null 2>&1
}

start_server() {
  require_postgres_install
  ensure_runtime_dirs
  if server_is_running; then
    return 0
  fi
  "$LANCHONETE_PG_BIN_DIR/pg_ctl" \
    -D "$LANCHONETE_PG_DATA_DIR" \
    -l "$LANCHONETE_PG_LOG_FILE" \
    -o "-p $LANCHONETE_PG_PORT -k $LANCHONETE_PG_SOCKET_DIR -h 127.0.0.1" \
    start >/dev/null
}

stop_server() {
  require_postgres_install
  if ! server_is_running; then
    return 0
  fi
  "$LANCHONETE_PG_BIN_DIR/pg_ctl" -D "$LANCHONETE_PG_DATA_DIR" stop >/dev/null
}

reload_server() {
  require_postgres_install
  if server_is_running; then
    "$LANCHONETE_PG_BIN_DIR/pg_ctl" -D "$LANCHONETE_PG_DATA_DIR" reload >/dev/null
  fi
}

ensure_host_password_auth() {
  local hba_file="$LANCHONETE_PG_DATA_DIR/pg_hba.conf"
  [ -f "$hba_file" ] || die "pg_hba.conf nao encontrado em $hba_file"
  perl -0pi -e 's/^host\s+all\s+all\s+127\.0\.0\.1\/32\s+trust$/host    all             all             127.0.0.1\/32            scram-sha-256/m' "$hba_file"
  perl -0pi -e 's/^host\s+all\s+all\s+::1\/128\s+trust$/host    all             all             ::1\/128                 scram-sha-256/m' "$hba_file"
  perl -0pi -e 's/^host\s+replication\s+all\s+127\.0\.0\.1\/32\s+trust$/host    replication     all             127.0.0.1\/32            scram-sha-256/m' "$hba_file"
  perl -0pi -e 's/^host\s+replication\s+all\s+::1\/128\s+trust$/host    replication     all             ::1\/128                 scram-sha-256/m' "$hba_file"
}

superuser_psql() {
  require_postgres_install
  "$LANCHONETE_PG_BIN_DIR/psql" -v ON_ERROR_STOP=1 postgres "$@"
}

app_password() {
  [ -f "$LANCHONETE_PG_PASSWORD_FILE" ] || die "senha local nao encontrada. Rode ./scripts/db/init-local-cluster.sh."
  tr -d '\n' < "$LANCHONETE_PG_PASSWORD_FILE"
}

psql_url() {
  local db_name="$1"
  local password
  password="$(app_password)"
  printf 'postgresql://%s:%s@127.0.0.1:%s/%s\n' \
    "$LANCHONETE_PG_APP_USER" \
    "$password" \
    "$LANCHONETE_PG_PORT" \
    "$db_name"
}

app_url() {
  local db_name="$1"
  printf '%s?schema=public\n' "$(psql_url "$db_name")"
}
