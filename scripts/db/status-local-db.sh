#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
. "$SCRIPT_DIR/common.sh"

require_postgres_install

if server_is_running; then
  printf 'status=running\n'
else
  printf 'status=stopped\n'
fi

printf 'install_root=%s\n' "$LANCHONETE_PG_INSTALL_ROOT"
printf 'data_dir=%s\n' "$LANCHONETE_PG_DATA_DIR"
printf 'socket_dir=%s\n' "$LANCHONETE_PG_SOCKET_DIR"
printf 'log_file=%s\n' "$LANCHONETE_PG_LOG_FILE"
printf 'port=%s\n' "$LANCHONETE_PG_PORT"

