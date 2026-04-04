#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./common.sh
. "$SCRIPT_DIR/common.sh"

require_command apt
require_command dpkg-deb

if [ -x "$LANCHONETE_PG_BIN_DIR/psql" ] && [ "${1-}" != "--force" ]; then
  printf 'PostgreSQL local ja esta instalado em %s\n' "$LANCHONETE_PG_INSTALL_ROOT"
  "$LANCHONETE_PG_BIN_DIR/psql" --version
  exit 0
fi

rm -rf "$LANCHONETE_PG_CACHE_DIR" "$LANCHONETE_PG_INSTALL_ROOT"
mkdir -p "$LANCHONETE_PG_CACHE_DIR" "$LANCHONETE_PG_INSTALL_ROOT"

(
  cd "$LANCHONETE_PG_CACHE_DIR"
  apt download postgresql-16 postgresql-client-16 libpq5 >/dev/null
  for pkg in ./*.deb; do
    dpkg-deb -x "$pkg" "$LANCHONETE_PG_INSTALL_ROOT"
  done
)

printf 'PostgreSQL local instalado em %s\n' "$LANCHONETE_PG_INSTALL_ROOT"
"$LANCHONETE_PG_BIN_DIR/psql" --version

