import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readSessionValue, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listNotes, syncNoteTags, toNoteDTO } from "@/lib/server-notes";

const schema = z.object({
  title: z.string().min(1),
  content: z.string().default(""),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

async function requireUserId() {
  const cookieStore = await cookies();
  const session = readSessionValue(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session?.userId) return null;
  return session.userId;
}

export async function GET(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "active";
  const q = searchParams.get("q") ?? undefined;
  const tag = searchParams.get("tag") ?? undefined;

  const notes = await listNotes(userId, { status, q, tag });
  return NextResponse.json({ ok: true, notes: notes.map(toNoteDTO) });
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "参数不合法" }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      excerpt: parsed.data.excerpt || parsed.data.content.slice(0, 120),
      userId,
    },
    include: {
      tags: { include: { tag: true } },
    },
  });

  await syncNoteTags(note.id, userId, parsed.data.tags);
  const refreshed = await prisma.note.findUniqueOrThrow({
    where: { id: note.id },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json({ ok: true, note: toNoteDTO(refreshed) });
}
