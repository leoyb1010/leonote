export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBriefingCron } from "@/lib/briefing/auth";
import { fetchSinaMarketSnapshots } from "@/lib/briefing/fetchers/sina-market";
import { fetchCryptoSnapshots } from "@/lib/briefing/fetchers/coingecko";

export async function POST(request: Request) {
  const denied = requireBriefingCron(request);
  if (denied) return denied;

  const run = await prisma.cronRun.create({ data: { task: "fetch-market", ok: false } });

  try {
    const [sina, crypto] = await Promise.all([
      fetchSinaMarketSnapshots(),
      fetchCryptoSnapshots().catch(() => ({ count: 0 })),
    ]);

    await prisma.cronRun.update({
      where: { id: run.id },
      data: { ok: true, endedAt: new Date(), message: `sina=${sina.count} crypto=${crypto.count}` },
    });

    return NextResponse.json({ ok: true, sina: sina.count, crypto: crypto.count });
  } catch (error) {
    await prisma.cronRun.update({
      where: { id: run.id },
      data: { ok: false, endedAt: new Date(), message: error instanceof Error ? error.message : "unknown" },
    });
    return NextResponse.json({ ok: false, message: "fetch-market failed" }, { status: 500 });
  }
}
