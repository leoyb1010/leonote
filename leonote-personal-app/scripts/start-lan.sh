#!/bin/sh
set -eu

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

export HOSTNAME="${LEONOTE_HOST:-0.0.0.0}"
export PORT="${PORT:-4317}"

if [ "${DATABASE_URL:-}" = "file:./dev.db" ] || [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="file:$(pwd)/prisma/dev.db"
fi

exec node .next/standalone/server.js
