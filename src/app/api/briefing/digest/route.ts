import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getBriefingData, getBriefingMeta } from "@/lib/briefing/query";
import { getLiveMarketSnapshots } from "@/lib/briefing/live-market";
import { getWeather } from "@/lib/briefing/weather";
import { getDailyHoroscopes } from "@/lib/briefing/horoscope";
import { parseBriefingDigestSummary } from "@/lib/briefing/normalize";
import { ensureBriefingFreshness } from "@/lib/briefing/ensure";
import { getBriefingThinkingInsights } from "@/lib/briefing/thinking";
import { buildBriefingEventRadar } from "@/lib/briefing/event-radar";
import type { BriefingCategory, BriefingRange } from "@/lib/briefing/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get("range") || "today";
  const categoryParam = searchParams.get("category") || "all";
  const forceRefresh = searchParams.get("refresh") === "1";
  const range = (["today", "week", "favorites"].includes(rangeParam) ? rangeParam : "today") as BriefingRange;
  const category = (["all", "world", "finance", "ai_tech"].includes(categoryParam) ? categoryParam : "all") as BriefingCategory | "all";

  const refreshStatus = range !== "favorites"
    ? await ensureBriefingFreshness({ force: forceRefresh, wait: forceRefresh, timeoutMs: 12_000 })
    : { started: false, inFlight: false, skipped: true };

  const [digest, items, marketState, weather, horoscopes, meta] = await Promise.all([
    prisma.briefingDigest.findUnique({ where: { date: startOfToday() } }),
    getBriefingData(userId, { range, category }),
    getLiveMarketSnapshots(),
    getWeather().catch(() => null),
    getDailyHoroscopes(forceRefresh).catch(() => []),
    getBriefingMeta(),
  ]);
  const thinkingInsights = await getBriefingThinkingInsights(userId, items);
  const eventClusters = buildBriefingEventRadar(items);

  return NextResponse.json({
    ok: true,
    digest: parseBriefingDigestSummary(digest?.summary),
    items,
    thinkingInsights,
    eventClusters,
    markets: marketState.markets,
    marketStatus: {
      refreshed: marketState.refreshed,
      stale: marketState.stale,
      error: marketState.error,
    },
    refreshStatus,
    weather,
    horoscopes,
    meta,
  });
}
