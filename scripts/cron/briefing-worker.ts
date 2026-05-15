import cron from "node-cron";

const baseUrl = process.env.LEONOTE_INTERNAL_URL || "http://localhost:4317";

if (!process.env.BRIEFING_CRON_TOKEN) {
  throw new Error("BRIEFING_CRON_TOKEN is required");
}

const cronToken: string = process.env.BRIEFING_CRON_TOKEN;
const cronHeaders: Record<string, string> = { "x-briefing-cron-token": cronToken };

async function callTask(path: string) {
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: cronHeaders,
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(`[briefing-cron] ${path} failed`, res.status, text.slice(0, 300));
      return;
    }
    console.log(`[briefing-cron] ${path} ok`, text.slice(0, 300));
  } catch (err) {
    console.error(`[briefing-cron] ${path} error`, err instanceof Error ? err.message : "unknown");
  }
}

// RSS fetch is cheap and primary: keep the briefing close to live during waking hours.
cron.schedule("*/10 5-6 * * *", () => callTask("/api/briefing/cron/fetch-news"), { timezone: "Asia/Shanghai" });
cron.schedule("*/5 7-23 * * *", () => callTask("/api/briefing/cron/fetch-news"), { timezone: "Asia/Shanghai" });

// Market data via Sina every 5 min during trading hours.
cron.schedule("*/5 9-16 * * 1-5", () => callTask("/api/briefing/cron/fetch-market"), { timezone: "Asia/Shanghai" });
// Market snapshots at open/close
cron.schedule("0 9,12,15 * * 1-5", () => callTask("/api/briefing/cron/fetch-market"), { timezone: "Asia/Shanghai" });

// Tavily fallback: four daily checkpoints, only if RSS didn't fill.
cron.schedule("0 8 * * *", () => callTask("/api/briefing/cron/fetch-tavily"), { timezone: "Asia/Shanghai" });
cron.schedule("0 12 * * *", () => callTask("/api/briefing/cron/fetch-tavily"), { timezone: "Asia/Shanghai" });
cron.schedule("0 16 * * *", () => callTask("/api/briefing/cron/fetch-tavily"), { timezone: "Asia/Shanghai" });
cron.schedule("0 20 * * *", () => callTask("/api/briefing/cron/fetch-tavily"), { timezone: "Asia/Shanghai" });

// Horoscope refresh: local-day cache invalidation at Shanghai midnight, with a morning safety retry.
cron.schedule("1 0 * * *", () => callTask("/api/briefing/cron/refresh-horoscope"), { timezone: "Asia/Shanghai" });
cron.schedule("30 6 * * *", () => callTask("/api/briefing/cron/refresh-horoscope"), { timezone: "Asia/Shanghai" });

// Morning digest: market + digest at 7:00
cron.schedule("5 7 * * *", async () => {
  await callTask("/api/briefing/cron/fetch-market");
  await callTask("/api/briefing/cron/generate-digest");
}, { timezone: "Asia/Shanghai" });

// Evening digest refresh
cron.schedule("0 18 * * *", async () => {
  await callTask("/api/briefing/cron/generate-digest");
}, { timezone: "Asia/Shanghai" });

console.log("[briefing-cron] worker started — RSS/X every 5min daytime, Tavily 4x/day fallback, horoscope local-day refresh");
