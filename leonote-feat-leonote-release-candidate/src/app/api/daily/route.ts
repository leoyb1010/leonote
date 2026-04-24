import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSessionValue, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toNoteDTO } from "@/lib/server-notes";

async function requireUserId() {
  const cookieStore = await cookies();
  const session = readSessionValue(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session?.userId) return null;
  return session.userId;
}

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const today = startOfDay();
  let daily = await prisma.dailyNote.findUnique({
    where: { date_userId: { date: today, userId } },
    include: { note: { include: { tags: { include: { tag: true } } } } },
  });

  if (!daily) {
    const note = await prisma.note.create({
      data: {
        title: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")} 每日笔记`,
        content: "",
        excerpt: "",
        userId,
      },
    });

    daily = await prisma.dailyNote.create({
      data: { date: today, userId, noteId: note.id },
      include: { note: { include: { tags: { include: { tag: true } } } } },
    });
  }

  const recent = await prisma.dailyNote.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 7,
    include: { note: { include: { tags: { include: { tag: true } } } } },
  });

  return NextResponse.json({
    ok: true,
    today: { id: daily.id, date: daily.date, note: toNoteDTO(daily.note) },
    recent: recent.map((item) => ({ id: item.id, date: item.date, note: toNoteDTO(item.note) })),
  });
}
