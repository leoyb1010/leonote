#!/bin/sh
set -eu

mkdir -p /app/data
touch /app/data/leonote.db

npx prisma migrate deploy

exec node .next/standalone/server.js
