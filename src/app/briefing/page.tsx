import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getBriefingData } from "@/lib/briefing/query";
import { getLiveMarketSnapshots } from "@/lib/briefing/live-market";
import { getWeather } from "@/lib/briefing/weather";
import { BriefingShell } from "@/components/briefing/BriefingShell";

export const dynamic = "force-dynamic";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default async function BriefingPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [digest, items, marketState, weather] = await Promise.all([
    prisma.briefingDigest.findUnique({ where: { date: startOfToday() } }),
    getBriefingData(userId, { range: "today", category: "all" }),
    getLiveMarketSnapshots(),
    getWeather().catch(() => null),
  ]);

  return (
    <BriefingShell
      initialDigest={digest ? JSON.parse(digest.summary) : null}
      initialItems={items}
      initialMarkets={marketState.markets}
      initialWeather={weather}
    />
  );
}
