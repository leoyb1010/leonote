export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBriefingCron } from "@/lib/briefing/auth";
import { fetchTavilyNews } from "@/lib/briefing/fetchers/tavily";

export async function POST(request: Request) {
  const denied = requireBriefingCron(request);
  if (denied) return denied;

  if (process.env.BRIEFING_ENABLED === "false" || process.env.BRIEFING_ENABLED === "0") {
    return NextResponse.json({ ok: true, skipped: true, reason: "BRIEFING_ENABLED=false" });
  }

  const run = await prisma.cronRun.create({ data: { task: "fetch-tavily", ok: false } });

  try {
    const result = await fetchTavilyNews();
    await prisma.cronRun.update({
      where: { id: run.id },
      data: { ok: true, endedAt: new Date(), message: `inserted=${result.inserted}` },
    });
    return NextResponse.json({ ok: true, tavily: result.inserted });
  } catch (error) {
    await prisma.cronRun.update({
      where: { id: run.id },
      data: { ok: false, endedAt: new Date(), message: error instanceof Error ? error.message : "unknown" },
    });
    return NextResponse.json({ ok: false, message: "fetch-tavily failed" }, { status: 500 });
  }
}
