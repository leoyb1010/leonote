import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readSessionValue, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureProject, syncNoteTags, toNoteDTO } from "@/lib/server-notes";

const jsonArraySchema = z.array(z.object({
  title: z.string().min(1),
  content: z.string().default(""),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  projectName: z.string().optional(),
}));

const jsonExportSchema = z.object({
  notes: jsonArraySchema,
});

async function requireUserId() {
  const cookieStore = await cookies();
  const session = readSessionValue(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session?.userId) return null;
  return session.userId;
}

async function createImportedNote(userId: string, data: { title: string; content: string; excerpt?: string; tags?: string[]; projectName?: string }) {
  const project = await ensureProject(userId, data.projectName);
  const note = await prisma.note.create({
    data: {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || data.content.slice(0, 120),
      userId,
      projectId: project?.id ?? null,
    },
  });
  await syncNoteTags(note.id, userId, data.tags ?? []);
  return note.id;
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const link = form.get("link");

  if (typeof link === "string" && link.trim()) {
    try {
      const target = new URL(link.trim());
      const res = await fetch(target.toString(), { redirect: "follow" });
      const html = await res.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch?.[1]?.trim() || target.hostname;
      const summary = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000);
      const note = await prisma.note.create({
        data: {
          title,
          content: `${title}\n\n来源：${target.toString()}\n\n${summary}`,
          excerpt: summary.slice(0, 120) || target.toString(),
          userId,
        },
        include: { project: true, tags: { include: { tag: true } } },
      });
      await syncNoteTags(note.id, userId, ["导入", "链接", target.hostname]);
      const refreshed = await prisma.note.findUniqueOrThrow({ where: { id: note.id }, include: { project: true, tags: { include: { tag: true } } } });
      return NextResponse.json({ ok: true, note: toNoteDTO(refreshed) });
    } catch {
      return NextResponse.json({ ok: false, message: "链接导入失败：链接无效或内容不可访问" }, { status: 400 });
    }
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "请选择导入文件或填写链接" }, { status: 400 });
  }

  const text = await file.text();
  const lower = file.name.toLowerCase();

  if (lower.endsWith(".json")) {
    let parsed: z.infer<typeof jsonArraySchema>;
    try {
      const raw = JSON.parse(text);
      parsed = Array.isArray(raw) ? jsonArraySchema.parse(raw) : jsonExportSchema.parse(raw).notes;
    } catch {
      return NextResponse.json({ ok: false, message: "JSON 导入失败：文件结构不合法" }, { status: 400 });
    }

    const createdIds: string[] = [];
    for (const item of parsed) createdIds.push(await createImportedNote(userId, item));
    return NextResponse.json({ ok: true, count: createdIds.length, noteId: createdIds[0] ?? null });
  }

  if (lower.endsWith(".md") || lower.endsWith(".txt") || lower.endsWith(".html") || lower.endsWith(".docx") || lower.endsWith(".pdf")) {
    const title = file.name.replace(/\.(md|txt|html|docx|pdf)$/i, "") || "导入笔记";
    const typeTag = lower.endsWith(".md") ? "Markdown" : lower.endsWith(".txt") ? "文本" : lower.endsWith(".html") ? "网页" : lower.endsWith(".docx") ? "Word" : "PDF";
    const content = lower.endsWith(".html") ? text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : text;
    const note = await prisma.note.create({
      data: {
        title,
        content,
        excerpt: content.trim().slice(0, 120) || "暂无摘要",
        userId,
      },
      include: { project: true, tags: { include: { tag: true } } },
    });
    await syncNoteTags(note.id, userId, ["导入", typeTag]);
    const refreshed = await prisma.note.findUniqueOrThrow({ where: { id: note.id }, include: { project: true, tags: { include: { tag: true } } } });
    return NextResponse.json({ ok: true, note: toNoteDTO(refreshed) });
  }

  return NextResponse.json({ ok: false, message: "导入失败：当前支持 JSON / Markdown / TXT / HTML / DOCX / PDF / 链接" }, { status: 400 });
}
