import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { toNoteDTO } from "@/lib/server-notes";

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const today = startOfDay();

  const daily = await prisma.dailyNote.findUnique({
    where: { date_userId: { date: today, userId } },
    include: { note: { include: { project: true, tags: { include: { tag: true } } } } },
  });

  const recent = await prisma.dailyNote.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 7,
    include: { note: { include: { project: true, tags: { include: { tag: true } } } } },
  });

  return NextResponse.json({
    ok: true,
    today: daily ? { id: daily.id, date: daily.date, note: toNoteDTO(daily.note) } : null,
    recent: recent.map((item) => ({ id: item.id, date: item.date, note: toNoteDTO(item.note) })),
  });
}
