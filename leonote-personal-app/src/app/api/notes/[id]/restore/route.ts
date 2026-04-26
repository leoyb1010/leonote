import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSessionValue, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOwnedNote, toNoteDTO } from "@/lib/server-notes";

async function requireUserId() {
  const cookieStore = await cookies();
  const session = readSessionValue(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session?.userId) return null;
  return session.userId;
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { id } = await context.params;
  const existing = await requireOwnedNote(id, userId);
  if (!existing) return NextResponse.json({ ok: false, message: "笔记不存在" }, { status: 404 });

  const note = await prisma.note.update({
    where: { id },
    data: { deletedAt: null, isArchived: false },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json({ ok: true, note: toNoteDTO(note) });
}
