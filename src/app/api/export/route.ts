import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listNotes, requireOwnedNote, toNoteDTO } from "@/lib/server-notes";
import { prisma } from "@/lib/prisma";
import { callChatText } from "@/lib/ai";
import { guardUserWriteRequest } from "@/lib/request-guard";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const noteId = searchParams.get("noteId");

  if (noteId) {
    const note = await requireOwnedNote(noteId, userId);
    if (!note) return NextResponse.json({ ok: false, message: "笔记不存在" }, { status: 404 });
    const content = `# ${note.title}\n\n${note.content}`;
    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="leonote-${note.id.slice(0, 6)}-raw.md"`,
      },
    });
  }

  const notes = await listNotes(userId, { status: "all", take: null });
  const tags = await prisma.tag.findMany({ where: { userId }, orderBy: { name: "asc" } });
  const exportedAt = new Date();
  const filename = `leonote-export-${exportedAt.toISOString().slice(0, 10)}.json`;
  const body = JSON.stringify({ exportedAt: exportedAt.toISOString(), notes: notes.map(toNoteDTO), tags: tags.map((t) => t.name) }, null, 2);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const guard = guardUserWriteRequest(request, userId, "export-ai", { limit: 20, windowMs: 60_000 });
  if (guard) return guard;

  const { searchParams } = new URL(request.url);
  const noteId = searchParams.get("noteId");
  const prompt = searchParams.get("prompt")?.trim();

  if (!noteId) {
    return NextResponse.json({ ok: false, message: "AI 整理导出需要指定 noteId" }, { status: 400 });
  }

  const note = await requireOwnedNote(noteId, userId);
  if (!note) return NextResponse.json({ ok: false, message: "笔记不存在" }, { status: 404 });

  const content = await callChatText({
    userId,
    system: "你是知识整理助手。输出适合导出的中文 Markdown。",
    prompt: `${prompt || "请将这篇笔记整理成精炼、保留知识点的输出。"}\n\n标题：${note.title}\n内容：${note.content}`,
  });

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="leonote-${note.id.slice(0, 6)}-ai.md"`,
    },
  });
}
