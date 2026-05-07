import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { requireOwnedNote, toNoteDTO } from "@/lib/server-notes";
import { guardUserWriteRequest } from "@/lib/request-guard";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "notes");
  if (guarded) return guarded;

  const { id } = await context.params;
  const existing = await requireOwnedNote(id, userId);
  if (!existing) return NextResponse.json({ ok: false, message: "笔记不存在" }, { status: 404 });

  const note = await prisma.note.update({
    where: { id },
    data: { deletedAt: new Date() },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json({ ok: true, note: toNoteDTO(note) });
}
