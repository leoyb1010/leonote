import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { requireOwnedNote } from "@/lib/server-notes";
import { callChatText } from "@/lib/ai";

const schema = z.object({ question: z.string().min(1) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "问题不能为空" }, { status: 400 });

  const { id } = await context.params;
  const note = await requireOwnedNote(id, userId);
  if (!note) return NextResponse.json({ message: "笔记不存在" }, { status: 404 });

  const answer = await callChatText({
    userId,
    system: "你是个人知识库助手。只能根据给定笔记内容回答，不确定就明确说不知道。输出简洁中文。",
    prompt: `笔记标题：${note.title}\n笔记内容：${note.content}\n\n问题：${parsed.data.question}`,
  });

  return NextResponse.json({ ok: true, answer });
}
