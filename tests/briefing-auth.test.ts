import { afterEach, describe, expect, it } from "vitest";
import { requireBriefingCron } from "../src/lib/briefing/auth";

describe("requireBriefingCron", () => {
  afterEach(() => {
    delete process.env.BRIEFING_CRON_TOKEN;
  });

  it("rejects cron requests when token is not configured", () => {
    const denied = requireBriefingCron(new Request("https://leonote.local/api/briefing/cron/fetch-news"));
    expect(denied?.status).toBe(503);
  });

  it("rejects missing or incorrect cron tokens", () => {
    process.env.BRIEFING_CRON_TOKEN = "test-cron-token";

    const missing = requireBriefingCron(new Request("https://leonote.local/api/briefing/cron/fetch-news"));
    expect(missing?.status).toBe(401);

    const wrong = requireBriefingCron(new Request("https://leonote.local/api/briefing/cron/fetch-news", {
      headers: { "x-briefing-cron-token": "wrong-token" },
    }));
    expect(wrong?.status).toBe(401);
  });

  it("accepts valid header and bearer tokens", () => {
    process.env.BRIEFING_CRON_TOKEN = "test-cron-token";

    const header = requireBriefingCron(new Request("https://leonote.local/api/briefing/cron/fetch-news", {
      headers: { "x-briefing-cron-token": "test-cron-token" },
    }));
    expect(header).toBeNull();

    const bearer = requireBriefingCron(new Request("https://leonote.local/api/briefing/cron/fetch-news", {
      headers: { authorization: "Bearer test-cron-token" },
    }));
    expect(bearer).toBeNull();
  });
});
