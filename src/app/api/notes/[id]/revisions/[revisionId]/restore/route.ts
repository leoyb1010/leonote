import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { guardUserWriteRequest } from "@/lib/request-guard";

export async function POST(request: Request, context: { params: Promise<{ id: string; revisionId: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "notes");
  if (guarded) return guarded;

  const { id, revisionId } = await context.params;
  const note = await prisma.note.findFirst({
    where: { id, userId },
    select: { id: true, title: true, content: true, excerpt: true },
  });
  if (!note) return NextResponse.json({ ok: false, message: "笔记不存在" }, { status: 404 });

  const revision = await prisma.noteRevision.findFirst({
    where: { id: revisionId, noteId: id, userId },
    select: { title: true, content: true, excerpt: true },
  });
  if (!revision) return NextResponse.json({ ok: false, message: "版本不存在" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    // Snapshot current state before restoring
    await tx.noteRevision.create({
      data: {
        noteId: id,
        userId,
        title: note.title,
        content: note.content,
        excerpt: note.excerpt,
        reason: "before_restore",
      },
    });

    await tx.note.update({
      where: { id },
      data: {
        title: revision.title,
        content: revision.content,
        excerpt: revision.excerpt,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
