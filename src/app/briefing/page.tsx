import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getBriefingData, getLatestMarketSnapshots } from "@/lib/briefing/query";
import { getWeather } from "@/lib/briefing/weather";
import { BriefingShell } from "@/components/briefing/BriefingShell";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default async function BriefingPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [digest, items, markets, weather] = await Promise.all([
    prisma.briefingDigest.findUnique({ where: { date: startOfToday() } }),
    getBriefingData(userId, { range: "today", category: "all" }),
    getLatestMarketSnapshots(),
    getWeather().catch(() => null),
  ]);

  return (
    <BriefingShell
      initialDigest={digest ? JSON.parse(digest.summary) : null}
      initialItems={items}
      initialMarkets={markets}
      initialWeather={weather}
    />
  );
}
