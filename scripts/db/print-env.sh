#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
. "$SCRIPT_DIR/common.sh"

require_postgres_install

cat <<EOF
DATABASE_URL="$(app_url "$LANCHONETE_PG_DEV_DB")"
DATABASE_REMOTE_URL=""
DIRECT_DATABASE_REMOTE_URL=""
NEON_API_KEY=""
EOF
