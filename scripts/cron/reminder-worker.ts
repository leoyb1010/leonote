import cron from "node-cron";

const baseUrl = process.env.LEONOTE_INTERNAL_URL || "http://localhost:4317";

if (baseUrl.startsWith("http://") && process.env.NODE_ENV !== "development") {
  console.warn("[reminder-cron] LEONOTE_INTERNAL_URL is using http:// — consider https:// in production to protect cron tokens");
}

if (!process.env.REMINDER_CRON_TOKEN) {
  throw new Error("REMINDER_CRON_TOKEN is required");
}

const cronToken: string = process.env.REMINDER_CRON_TOKEN;
const cronHeaders: Record<string, string> = { "x-reminder-cron-token": cronToken };

async function callTask() {
  try {
    const res = await fetch(`${baseUrl}/api/reminders/cron/send-due`, {
      method: "POST",
      headers: cronHeaders,
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("[reminder-cron] send-due failed", res.status, text.slice(0, 300));
      return;
    }
    console.log("[reminder-cron] send-due ok", text.slice(0, 300));
  } catch (err) {
    console.error("[reminder-cron] send-due error", err instanceof Error ? err.message : "unknown");
  }
}

cron.schedule("* * * * *", () => callTask(), { timezone: "Asia/Shanghai" });

console.log("[reminder-cron] worker started — checking due reminders every minute");
