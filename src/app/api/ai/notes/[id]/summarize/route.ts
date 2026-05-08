import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { requireOwnedNote } from "@/lib/server-notes";
import { callChatText } from "@/lib/ai";
import { guardUserWriteRequest } from "@/lib/request-guard";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ message: "未登录" }, { status: 401 });

  const guard = guardUserWriteRequest(request, userId, "ai-note-summarize", { limit: 20, windowMs: 60_000 });
  if (guard) return guard;

  const { id } = await context.params;
  const note = await requireOwnedNote(id, userId);
  if (!note) return NextResponse.json({ message: "笔记不存在" }, { status: 404 });

  const summary = await callChatText({
    userId,
    system: "你是个人知识库助手。请输出简洁中文总结，按要点组织，不要胡编。",
    prompt: `请总结这篇笔记，输出：\n1. 核心结论\n2. 关键要点\n3. 可执行事项（如果有）\n\n标题：${note.title}\n内容：${note.content}`,
  });

  return NextResponse.json({ ok: true, summary });
}
