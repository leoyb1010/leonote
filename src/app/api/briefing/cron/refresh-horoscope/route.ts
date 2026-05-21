export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBriefingCron } from "@/lib/briefing/auth";
import { getDailyHoroscopes, invalidateHoroscopeCache } from "@/lib/briefing/horoscope";

export async function POST(request: Request) {
  const denied = requireBriefingCron(request);
  if (denied) return denied;

  if (process.env.BRIEFING_ENABLED === "false" || process.env.BRIEFING_ENABLED === "0") {
    return NextResponse.json({ ok: true, skipped: true, reason: "BRIEFING_ENABLED=false" });
  }

  const run = await prisma.cronRun.create({ data: { task: "refresh-horoscope", ok: false } });

  try {
    invalidateHoroscopeCache();
    const horoscopes = await getDailyHoroscopes(true);
    await prisma.cronRun.update({
      where: { id: run.id },
      data: { ok: true, endedAt: new Date(), message: `profiles=${horoscopes.length}` },
    });
    return NextResponse.json({ ok: true, count: horoscopes.length });
  } catch (error) {
    await prisma.cronRun.update({
      where: { id: run.id },
      data: { ok: false, endedAt: new Date(), message: error instanceof Error ? error.message : "unknown" },
    });
    return NextResponse.json({ ok: false, message: "refresh-horoscope failed" }, { status: 500 });
  }
}
