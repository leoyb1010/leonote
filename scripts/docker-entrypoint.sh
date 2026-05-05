#!/bin/sh
set -eu

mkdir -p /app/data

npx prisma migrate deploy

exec node .next/standalone/server.js
