FROM node:22-bookworm-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=4317
ENV DATABASE_URL=file:/app/data/leonote.db
ENV RUST_LOG=info

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl sqlite3 \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build && npm run standalone:prepare

EXPOSE 4317

ENTRYPOINT ["sh", "scripts/docker-entrypoint.sh"]
