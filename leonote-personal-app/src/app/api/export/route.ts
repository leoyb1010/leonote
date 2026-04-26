import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSessionValue, SESSION_COOKIE } from "@/lib/auth";
import { listNotes, requireOwnedNote, toNoteDTO } from "@/lib/server-notes";
import { prisma } from "@/lib/prisma";
import { callChatText } from "@/lib/ai";

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
  const noteId = searchParams.get("noteId");
  const useAI = searchParams.get("ai") === "1";
  const prompt = searchParams.get("prompt")?.trim();

  if (noteId) {
    const note = await requireOwnedNote(noteId, userId);
    if (!note) return NextResponse.json({ ok: false, message: "笔记不存在" }, { status: 404 });
    const content = useAI
      ? await callChatText({
          userId,
          system: "你是知识整理助手。输出适合导出的中文 Markdown。",
          prompt: `${prompt || "请将这篇笔记整理成精炼、保留知识点的输出。"}\n\n标题：${note.title}\n内容：${note.content}`,
        })
      : `# ${note.title}\n\n${note.content}`;
    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="leonote-${note.id.slice(0, 6)}-${useAI ? "ai" : "raw"}.md"`,
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
