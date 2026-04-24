import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readSessionValue, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncNoteTags, toNoteDTO } from "@/lib/server-notes";

const jsonSchema = z.array(z.object({
  title: z.string().min(1),
  content: z.string().default(""),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional(),
}));

async function requireUserId() {
  const cookieStore = await cookies();
  const session = readSessionValue(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session?.userId) return null;
  return session.userId;
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "请选择导入文件" }, { status: 400 });
  }

  const text = await file.text();
  const lower = file.name.toLowerCase();

  if (lower.endsWith(".json")) {
    let parsed: z.infer<typeof jsonSchema>;
    try {
      parsed = jsonSchema.parse(JSON.parse(text));
    } catch {
      return NextResponse.json({ ok: false, message: "JSON 导入失败：文件结构不合法" }, { status: 400 });
    }

    const createdIds: string[] = [];
    for (const item of parsed) {
      const note = await prisma.note.create({
        data: {
          title: item.title,
          content: item.content,
          excerpt: item.excerpt || item.content.slice(0, 120),
          userId,
        },
      });
      await syncNoteTags(note.id, userId, item.tags ?? []);
      createdIds.push(note.id);
    }

    return NextResponse.json({ ok: true, count: createdIds.length, noteId: createdIds[0] ?? null });
  }

  if (lower.endsWith(".md") || lower.endsWith(".txt")) {
    const title = file.name.replace(/\.(md|txt)$/i, "") || "导入笔记";
    const note = await prisma.note.create({
      data: {
        title,
        content: text,
        excerpt: text.trim().slice(0, 120) || "暂无摘要",
        userId,
      },
      include: { tags: { include: { tag: true } } },
    });
    await syncNoteTags(note.id, userId, lower.endsWith(".md") ? ["导入", "Markdown"] : ["导入", "文本"]);
    const refreshed = await prisma.note.findUniqueOrThrow({ where: { id: note.id }, include: { tags: { include: { tag: true } } } });
    return NextResponse.json({ ok: true, note: toNoteDTO(refreshed) });
  }

  return NextResponse.json({ ok: false, message: "导入失败：当前支持 JSON / Markdown / TXT" }, { status: 400 });
}
