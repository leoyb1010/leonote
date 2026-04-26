# Leonote Personal Deployment

This setup is optimized for one-person use with a persistent SQLite database.

## Local Verification

```bash
npm ci
cp .env.example .env
openssl rand -hex 32
npm run db:generate
npm run db:migrate
npm run lint
npm run typecheck
npm run build
npm run start:lan
```

Paste the random value into `AUTH_SECRET` in `.env`, then open `http://localhost:4317`, register the first account, and sign in.

For iPhone testing on the same Wi-Fi, use the non-default LAN preview port:

```bash
npm run dev:lan
```

Then open `http://YOUR_MAC_LAN_IP:4317` on iPhone. For this Mac right now, the URL is `http://192.168.3.63:4317`.

## Docker Deployment

Create production env:

```bash
cp .env.production.example .env.production
openssl rand -hex 32
```

Paste the random value into `AUTH_SECRET` in `.env.production`.

Start the app:

```bash
docker compose up -d --build
```

The app listens on `http://SERVER_IP:4317`. Put Caddy, Nginx, Traefik, or a cloud load balancer in front of it for HTTPS.

## HTTPS Requirement

For LAN testing over `http://`, leave `AUTH_COOKIE_SECURE` unset. For production over HTTPS, set `APP_URL` to your final HTTPS domain and keep `AUTH_COOKIE_SECURE=true`. iOS home-screen usage also works best over HTTPS.

Example Caddy reverse proxy:

```caddyfile
notes.example.com {
  reverse_proxy 127.0.0.1:4317
}
```

## iPhone / Mac Install

After HTTPS is live:

1. Open the domain in Safari on iPhone.
2. Share -> Add to Home Screen.
3. Open Leonote from the home screen.

On Mac, open the domain in Safari or Chrome and install/add it as an app from the browser UI.

## Backups

For local development:

```bash
npm run backup
```

For a server where the database is mounted at `/var/lib/leonote/leonote.db`:

```bash
DATABASE_FILE=/var/lib/leonote/leonote.db BACKUP_DIR=/var/backups/leonote sh scripts/backup-sqlite.sh
```

With Docker named volumes, first inspect the volume path:

```bash
docker volume inspect leonote-personal-app_leonote-data
```

Then back up the `leonote.db` file from that mountpoint, or copy it out from the container:

```bash
docker compose cp leonote:/app/data/leonote.db ./backups/leonote.db.backup-$(date +%Y%m%d-%H%M%S)
```

## Operations

```bash
docker compose logs -f
docker compose restart
docker compose pull
docker compose up -d --build
```
