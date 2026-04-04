#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
. "$SCRIPT_DIR/common.sh"

require_postgres_install
start_server

PGPASSWORD="$(app_password)" "$LANCHONETE_PG_BIN_DIR/psql" -v ON_ERROR_STOP=1 "$(psql_url "$LANCHONETE_PG_DEV_DB")" <<'SQL'
DROP TABLE IF EXISTS public._db_smoke_probe;
CREATE TABLE public._db_smoke_probe (
  id integer PRIMARY KEY,
  label text NOT NULL
);
INSERT INTO public._db_smoke_probe (id, label) VALUES (1, 'ok');
TABLE public._db_smoke_probe;
DELETE FROM public._db_smoke_probe WHERE id = 1;
SELECT count(*) AS remaining_rows FROM public._db_smoke_probe;
DROP TABLE public._db_smoke_probe;
SQL

printf 'Smoke test concluido em %s\n' "$LANCHONETE_PG_DEV_DB"
