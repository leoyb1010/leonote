import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getBriefingData, getBriefingMeta, getLatestXSignalFetchAt } from "@/lib/briefing/query";
import { getLiveMarketSnapshots } from "@/lib/briefing/live-market";
import { getWeather } from "@/lib/briefing/weather";
import { getDailyHoroscopes } from "@/lib/briefing/horoscope";
import { parseBriefingDigestSummary } from "@/lib/briefing/normalize";
import { ensureBriefingFreshness } from "@/lib/briefing/ensure";
import { getBriefingThinkingInsights } from "@/lib/briefing/thinking";
import { buildBriefingEventRadar, buildBriefingXSignals } from "@/lib/briefing/event-radar";
import { BriefingShell } from "@/components/briefing/BriefingShell";

export const dynamic = "force-dynamic";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default async function BriefingPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  await ensureBriefingFreshness();

  const [digest, items, marketState, weather, horoscopes, meta, xSignalsUpdatedAt] = await Promise.all([
    prisma.briefingDigest.findUnique({ where: { date: startOfToday() } }),
    getBriefingData(userId, { range: "today", category: "all" }),
    getLiveMarketSnapshots(),
    getWeather().catch(() => null),
    getDailyHoroscopes().catch(() => []),
    getBriefingMeta(),
    getLatestXSignalFetchAt(),
  ]);
  const thinkingInsights = await getBriefingThinkingInsights(userId, items);
  const eventClusters = buildBriefingEventRadar(items);
  const xSignals = buildBriefingXSignals(items);

  return (
    <BriefingShell
      initialDigest={parseBriefingDigestSummary(digest?.summary)}
      initialItems={items}
      initialThinkingInsights={thinkingInsights}
      initialEventClusters={eventClusters}
      initialXSignals={xSignals}
      initialXSignalsUpdatedAt={xSignalsUpdatedAt}
      initialMarkets={marketState.markets}
      initialWeather={weather}
      initialHoroscopes={horoscopes}
      initialMeta={meta}
    />
  );
}
