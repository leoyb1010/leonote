#!/bin/sh
set -eu

SOURCE="${DATABASE_FILE:-./prisma/dev.db}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

if [ ! -f "$SOURCE" ]; then
  echo "Database file not found: $SOURCE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
BASENAME="$(basename "$SOURCE")"
TARGET="$BACKUP_DIR/${BASENAME}.backup-${STAMP}"

if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$SOURCE" ".backup '$TARGET'"
else
  cp "$SOURCE" "$TARGET"
fi

echo "$TARGET"
