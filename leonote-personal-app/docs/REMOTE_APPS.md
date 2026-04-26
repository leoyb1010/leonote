# Leonote Remote Apps

Leonote has two runtime roles:

- Server: one Mac mini or VPS runs the Next.js service and owns the only SQLite database.
- Clients: Mac App, MacBook browser, and iPhone PWA all open the same server URL.

Do not run separate local Mac Apps if you want shared data. Separate local databases do not sync.

## Current Mac App

The installed app at `/Applications/Leonote.app` is a remote client.

It reads its server URL from:

```text
~/Library/Application Support/leonote/server-url.txt
```

Change the URL from the app menu:

```text
Leonote -> 设置服务器地址
```

For temporary LAN testing, this machine currently uses:

```text
http://192.168.3.63:4317
```

For long-term use, replace it with your HTTPS domain:

```text
https://notes.example.com
```

## Recommended Production Shape

```text
Mac mini
  Leonote server
  SQLite database
  Caddy/Nginx HTTPS reverse proxy

MacBook
  /Applications/Leonote.app -> https://notes.example.com

iPhone
  Safari Add to Home Screen -> https://notes.example.com
```

The external domain stays stable. Internal ports can change because the reverse proxy maps the domain to the actual local port.

Example:

```text
https://notes.example.com -> 127.0.0.1:4317
```

If later the server moves to port `5001`, only change the proxy:

```text
https://notes.example.com -> 127.0.0.1:5001
```

Mac App and iPhone still use the same domain.

## Mac Mini Server: LAN Test

On the Mac mini:

```bash
cd "/path/to/leonote-personal-app"
npm ci
cp .env.example .env
openssl rand -hex 32
npm run db:generate
npm run db:migrate
npm run build
npm run start:lan
```

Paste the random secret into `.env` as `AUTH_SECRET`.

Find the Mac mini IP:

```bash
ipconfig getifaddr en0
```

Then test from MacBook/iPhone:

```text
http://MAC_MINI_IP:4317
```

This is good for same-Wi-Fi testing only.

## Mac Mini Server: Domain + HTTPS

Use a domain such as:

```text
notes.example.com
```

Point the DNS `A` record to your public IP.

On the Mac mini, run Leonote on an internal port:

```bash
cd "/path/to/leonote-personal-app"
npm ci
cp .env.production.example .env.production
openssl rand -hex 32
npm run db:generate
npm run db:migrate
npm run build
HOSTNAME=127.0.0.1 PORT=4317 npm run start
```

Use Caddy for HTTPS reverse proxy:

```caddyfile
notes.example.com {
  reverse_proxy 127.0.0.1:4317
}
```

Then all clients use:

```text
https://notes.example.com
```

## iPhone

Open the final URL in Safari:

```text
https://notes.example.com
```

Then:

```text
Share -> Add to Home Screen
```

The iPhone icon uses the PWA manifest and shares the same server data.

## Safer External Access Option

If you do not want to expose your home Mac mini directly to the public internet, use Tailscale:

1. Install Tailscale on Mac mini, MacBook, and iPhone.
2. Run Leonote on Mac mini with `npm run dev:lan` or a production start command.
3. Use the Mac mini Tailscale IP or MagicDNS name as the server URL.

This keeps Leonote private to your devices.
