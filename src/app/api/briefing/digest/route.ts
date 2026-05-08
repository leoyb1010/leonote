import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getBriefingData, getLatestMarketSnapshots } from "@/lib/briefing/query";
import { getWeather } from "@/lib/briefing/weather";
import type { BriefingCategory, BriefingRange } from "@/lib/briefing/types";

export const dynamic = "force-dynamic";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const range = (searchParams.get("range") || "today") as BriefingRange;
  const category = (searchParams.get("category") || "all") as BriefingCategory | "all";

  const [digest, items, markets, weather] = await Promise.all([
    prisma.briefingDigest.findUnique({ where: { date: startOfToday() } }),
    getBriefingData(userId, { range, category }),
    getLatestMarketSnapshots(),
    getWeather().catch(() => null),
  ]);

  return NextResponse.json({
    ok: true,
    digest: digest ? JSON.parse(digest.summary) : null,
    items,
    markets,
    weather,
  });
}
