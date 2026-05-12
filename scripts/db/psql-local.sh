#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
. "$SCRIPT_DIR/common.sh"

require_postgres_install

DB_NAME="${1:-$LANCHONETE_PG_DEV_DB}"
if [ "$#" -gt 0 ]; then
  shift
fi

PGPASSWORD="$(app_password)" exec "$LANCHONETE_PG_BIN_DIR/psql" "$(psql_url "$DB_NAME")" "$@"
