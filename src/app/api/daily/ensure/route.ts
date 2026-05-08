import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { toNoteDTO } from "@/lib/server-notes";
import { guardUserWriteRequest } from "@/lib/request-guard";

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const guard = guardUserWriteRequest(request, userId, "daily-ensure");
  if (guard) return guard;

  const today = startOfDay();
  const title = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")} 每日笔记`;

  const daily = await prisma.$transaction(async (tx) => {
    const existing = await tx.dailyNote.findUnique({
      where: { date_userId: { date: today, userId } },
      include: { note: { include: { project: true, tags: { include: { tag: true } } } } },
    });
    if (existing) return existing;

    const note = await tx.note.create({ data: { title, content: "", excerpt: "", userId } });
    try {
      return await tx.dailyNote.create({
        data: { date: today, userId, noteId: note.id },
        include: { note: { include: { project: true, tags: { include: { tag: true } } } } },
      });
    } catch {
      await tx.note.delete({ where: { id: note.id } }).catch(() => null);
      return tx.dailyNote.findUniqueOrThrow({
        where: { date_userId: { date: today, userId } },
        include: { note: { include: { project: true, tags: { include: { tag: true } } } } },
      });
    }
  });

  return NextResponse.json({
    ok: true,
    today: { id: daily.id, date: daily.date, note: toNoteDTO(daily.note) },
  });
}
