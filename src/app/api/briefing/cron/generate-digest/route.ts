export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBriefingCron } from "@/lib/briefing/auth";
import { generateBriefingDigest } from "@/lib/briefing/digest";

export async function POST(request: Request) {
  const denied = requireBriefingCron(request);
  if (denied) return denied;

  const run = await prisma.cronRun.create({ data: { task: "generate-digest", ok: false } });

  try {
    const digest = await generateBriefingDigest();
    await prisma.cronRun.update({
      where: { id: run.id },
      data: { ok: true, endedAt: new Date(), message: digest.id },
    });
    return NextResponse.json({ ok: true, digest });
  } catch (error) {
    await prisma.cronRun.update({
      where: { id: run.id },
      data: { ok: false, endedAt: new Date(), message: error instanceof Error ? error.message : "unknown" },
    });
    return NextResponse.json({ ok: false, message: "generate-digest failed" }, { status: 500 });
  }
}
