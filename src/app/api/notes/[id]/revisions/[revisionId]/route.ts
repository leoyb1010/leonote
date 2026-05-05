import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ id: string; revisionId: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { id, revisionId } = await context.params;
  const note = await prisma.note.findFirst({ where: { id, userId }, select: { id: true } });
  if (!note) return NextResponse.json({ ok: false, message: "笔记不存在" }, { status: 404 });

  const revision = await prisma.noteRevision.findFirst({
    where: { id: revisionId, noteId: id, userId },
    select: {
      id: true,
      title: true,
      content: true,
      excerpt: true,
      reason: true,
      createdAt: true,
    },
  });

  if (!revision) return NextResponse.json({ ok: false, message: "版本不存在" }, { status: 404 });

  return NextResponse.json({ ok: true, revision });
}
