import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { id } = await context.params;
  const note = await prisma.note.findFirst({ where: { id, userId }, select: { id: true } });
  if (!note) return NextResponse.json({ ok: false, message: "笔记不存在" }, { status: 404 });

  const revisions = await prisma.noteRevision.findMany({
    where: { noteId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      excerpt: true,
      reason: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    revisions: revisions.map((r) => ({
      id: r.id,
      title: r.title,
      excerpt: r.excerpt,
      reason: r.reason,
      createdAt: r.createdAt,
    })),
  });
}
