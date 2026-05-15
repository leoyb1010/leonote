export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBriefingCron } from "@/lib/briefing/auth";
import { fetchNewsSources } from "@/lib/briefing/fetchers/rss";
import { fetchXSignals } from "@/lib/briefing/fetchers/x-api";
import { generateBriefingDigest } from "@/lib/briefing/digest";

export async function POST(request: Request) {
  const denied = requireBriefingCron(request);
  if (denied) return denied;

  const run = await prisma.cronRun.create({ data: { task: "fetch-news", ok: false } });

  try {
    const results = await fetchNewsSources();
    const xSignals = await fetchXSignals().catch((error) => ({
      ok: false,
      skipped: false,
      reason: error instanceof Error ? error.message : "unknown",
      users: 0,
      inserted: 0,
    }));
    const digest = await generateBriefingDigest();
    await prisma.cronRun.update({
      where: { id: run.id },
      data: { ok: true, endedAt: new Date(), message: `sources=${results.length}; x=${xSignals.inserted}${xSignals.skipped ? " skipped" : ""}; digest=${digest.id}` },
    });
    return NextResponse.json({ ok: true, rss: results.length, xSignals, digestId: digest.id });
  } catch (error) {
    await prisma.cronRun.update({
      where: { id: run.id },
      data: { ok: false, endedAt: new Date(), message: error instanceof Error ? error.message : "unknown" },
    });
    return NextResponse.json({ ok: false, message: "fetch-news failed" }, { status: 500 });
  }
}
