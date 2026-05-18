<div align="center">

# Leonote

<p>
  <em>"A quiet home for notes, memory, and daily intelligence." · 「把想法安放成时间里的智慧。」</em>
</p>

<p>
  <a href="./README.md">简体中文</a>
  ·
  <a href="./README.en.md">English</a>
</p>

<p>
  <a href="#preview">Preview</a>
  ·
  <a href="#highlights">Highlights</a>
  ·
  <a href="#quick-start">Quick Start</a>
  ·
  <a href="#production">Production</a>
  ·
  <a href="#version">Version</a>
</p>

<p>
  <img alt="Version" src="https://img.shields.io/badge/Version-v1.8.0-7B84F6?style=for-the-badge">
  <img alt="License" src="https://img.shields.io/badge/License-Personal%20Use%20Only-F26D6D?style=for-the-badge">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-111111?style=for-the-badge&logo=nextdotjs">
  <img alt="Tauri" src="https://img.shields.io/badge/Tauri-2-24C8DB?style=for-the-badge&logo=tauri">
  <img alt="PWA" src="https://img.shields.io/badge/PWA-Ready-5EC9A8?style=for-the-badge">
  <img alt="Quiet Material" src="https://img.shields.io/badge/Design-Quiet%20Material-8A95FF?style=for-the-badge">
</p>

<p>
  <strong>A self-hosted personal knowledge residence for notes, long-term memory, daily briefings, a gear library, and lightweight finance.</strong><br>
  Built for quiet writing, calm retrieval, and a consistent experience across desktop, tablet, mobile, PWA, and Tauri WebView shells.
</p>

</div>

---

## Preview

<p align="center">
  <img src="./docs/images/leonote-briefing-desktop.png" alt="Leonote Daily Briefing on desktop" width="100%">
</p>

<p align="center">
  <img src="./docs/images/leonote-home-desktop.png" alt="Leonote Today page on desktop" width="49%">
  <img src="./docs/images/leonote-notes-desktop.png" alt="Leonote note editor on desktop" width="49%">
</p>

<p align="center">
  <img src="./docs/images/leonote-mobile-briefing.png" alt="Leonote Daily Briefing on mobile" width="320">
</p>

<p align="center">
  <sub>Screenshots are maintained for the current v1.8.0 Quiet Material UI across desktop, note editing, mobile briefing, and schedule workspace layouts.</sub>
</p>

## Overview

Leonote is a self-hosted personal note-taking and knowledge home. It combines Markdown notes, projects, tags, search, long-term AI memory, a daily intelligence briefing, a gear library, and lightweight expense tracking in one calm private workspace.

The product follows a **Quiet Material** design language: restrained surfaces, subtle borders, careful typography, and layouts designed for repeated daily use rather than visual noise.

## Highlights

- **Personal notes**: Markdown editor, safe live preview, tags, projects, favorites, archive, trash, version history, inline images, attachments, and camera capture into the note body.
- **Daily briefing**: RSS / Tavily / CoinGecko / Sina market data, AI summaries, quality scores, Chinese normalization, market strip, weather, horoscope, and note import.
- **AI-assisted thinking**: an event radar for domestic/international/AI-tech/market signals plus seven high-impact thoughts.
- **Global AI assistant**: a context-aware AI panel that can be opened from the current page.
- **Inline attachments**: paste or drag images and documents directly into note content.
- **Gear library & ledger**: capture device or item models, price, channel, warranty, serial number, status, and location, with optional linked expenses plus the original ledger flow.
- **Search**: SQLite FTS5 full-text search with Chinese phrase matching.
- **Self-hosted first**: one server, one SQLite database, browser/PWA/mobile/desktop access.

## Quick Start

```bash
git clone https://github.com/leoyb1010/leonote.git
cd leonote

cp .env.example .env
# Edit .env and set at least AUTH_SECRET.
# Example secret: openssl rand -base64 48

npm install
npx prisma migrate deploy
npm run dev
```

Open `http://localhost:3000` and register the first account.

## Production

```bash
npm install
npm run build
npm run start:prod
```

By default the production server listens on `http://0.0.0.0:4317`. Put it behind Nginx or Caddy with HTTPS for real deployment.

## Docker

```bash
cp .env.example .env.production
# Edit .env.production
docker compose up -d --build
```

More details: [docs/deployment.md](docs/deployment.md).

## Environment

```env
AUTH_SECRET="change-me-to-a-long-random-secret"
DATABASE_URL="file:./data/leonote.db"
LEONOTE_PUBLIC_URL="https://leonote.example.com"
LEONOTE_ALLOW_REGISTRATION="false"
LEONOTE_TRUST_PROXY_HEADERS="false"

AI_BASE_URL="https://api.deepseek.com"
AI_MODEL="deepseek-v4-flash"
AI_FALLBACK_MODEL="deepseek-v4-pro"

BRIEFING_CRON_TOKEN="change-me-long-random-token"
BRIEFING_AUTO_REFRESH="true"
BRIEFING_MIN_ITEMS="24"
BRIEFING_MAX_AGE_MINUTES="5"
BRIEFING_TRANSLATE_ENGLISH="true"
RSSHUB_BASE_URL="https://rsshub.app"
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16, React 19, TypeScript |
| Database | Prisma, SQLite |
| Styling | Tailwind CSS, CSS variables, Quiet Material tokens |
| Desktop shell | Tauri 2 WebView |
| AI | DeepSeek / OpenAI-compatible APIs |
| Testing | Vitest, Playwright |
| Deployment | Docker, PM2, direct Node runtime |

## Cross-Device Use

| Device | Access |
|---|---|
| Mac / PC browser | Use the deployed domain directly |
| iOS / Android / HarmonyOS browser | Use the deployed domain directly |
| iOS PWA | Safari -> Add to Home Screen |
| Desktop app shell | Tauri WebView pointing to the deployed domain |

## Version

Current version: **v1.8.0**

Recent release focus:

- New personal schedule module with Today / Week timelines, event creation, done/restore/delete actions, color markers, and note/project/gear links.
- The Today page now surfaces schedule blocks, and project cards show upcoming linked schedule events.
- The Cal-like workspace visual system is expanded across navigation, page headers, dashboard metrics, object-library lists, and quick action areas.
- Dashboard containers now use wider desktop breakpoints so web layouts feel fuller instead of leaving large side gutters.
- Gear Library, Notes, Projects, Briefing, and Schedule share clearer object-workbench language and icon semantics.

For the full Chinese changelog, see [README.md](README.md#版本记录).

## License

Personal Use Only. This repository is private-product oriented and not intended as an open-source distribution license.
