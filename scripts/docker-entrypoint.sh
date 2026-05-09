#!/bin/sh
set -eu

mkdir -p /app/data
touch /app/data/leonote.db

if [ -s /app/data/leonote.db ]; then
  mkdir -p /app/data/backups
  stamp="$(date +%Y%m%d-%H%M%S)"
  sqlite3 /app/data/leonote.db ".backup '/app/data/backups/pre-migrate-$stamp.db'"
  integrity="$(sqlite3 "/app/data/backups/pre-migrate-$stamp.db" "PRAGMA integrity_check;")"
  if [ "$integrity" != "ok" ]; then
    echo "SQLite backup integrity check failed: $integrity" >&2
    exit 1
  fi
fi

npx prisma migrate deploy

exec node .next/standalone/server.js
