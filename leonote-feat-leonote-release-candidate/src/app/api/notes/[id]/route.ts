import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readSessionValue, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOwnedNote, syncNoteTags, toNoteDTO } from "@/lib/server-notes";

const schema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
});

async function requireUserId() {
  const cookieStore = await cookies();
  const session = readSessionValue(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session?.userId) return null;
  return session.userId;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { id } = await context.params;
  const note = await requireOwnedNote(id, userId);
  if (!note) return NextResponse.json({ ok: false, message: "笔记不存在" }, { status: 404 });

  return NextResponse.json({ ok: true, note: toNoteDTO(note) });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "参数不合法" }, { status: 400 });
  }

  const existing = await requireOwnedNote(id, userId);
  if (!existing) return NextResponse.json({ ok: false, message: "笔记不存在" }, { status: 404 });

  await prisma.note.update({
    where: { id },
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      excerpt: parsed.data.excerpt,
      isFavorite: parsed.data.favorite,
      isPinned: parsed.data.pinned,
      isArchived: parsed.data.archived,
    },
  });

  if (parsed.data.tags) {
    await syncNoteTags(id, userId, parsed.data.tags);
  }

  const note = await prisma.note.findUniqueOrThrow({
    where: { id },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json({ ok: true, note: toNoteDTO(note) });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { id } = await context.params;
  const existing = await requireOwnedNote(id, userId);
  if (!existing) return NextResponse.json({ ok: false, message: "笔记不存在" }, { status: 404 });
  if (!existing.deletedAt) {
    return NextResponse.json({ ok: false, message: "请先移入回收站" }, { status: 400 });
  }

  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
