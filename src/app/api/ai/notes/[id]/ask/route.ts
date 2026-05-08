import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { requireOwnedNote } from "@/lib/server-notes";
import { callChatJSON } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { guardUserWriteRequest } from "@/lib/request-guard";

const requestSchema = z.object({ question: z.string().min(1) });
const responseSchema = z.object({
  answer: z.string().min(1),
  memoryRefs: z.array(z.object({ id: z.string().min(1), reason: z.string().min(1) })).max(4).default([]),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ message: "未登录" }, { status: 401 });

  const guard = guardUserWriteRequest(request, userId, "ai-note-ask", { limit: 30, windowMs: 60_000 });
  if (guard) return guard;

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "问题不能为空" }, { status: 400 });

  const { id } = await context.params;
  const note = await requireOwnedNote(id, userId);
  if (!note) return NextResponse.json({ message: "笔记不存在" }, { status: 404 });

  const memories = await prisma.memoryFact.findMany({
    where: { userId, isActive: true },
    orderBy: [{ updatedAt: "desc" }],
    take: 12,
    select: { id: true, type: true, content: true, confidence: true },
  });

  const result = responseSchema.parse(await callChatJSON<unknown>({
    userId,
    system: [
      "你是 Leonote 静读助手。只能根据给定笔记与长期记忆回答。",
      "输出 JSON。answer 用简洁中文，自然分段，不要一长段堆砌。",
      "如果用户问笔记内容相关的问题，先给一句话总结，再展开要点。",
      "memoryRefs 只保留真正有帮助的记忆 id，最多 4 条。",
    ].join("\n"),
    prompt: [
      `笔记标题：${note.title}`,
      `笔记内容：${note.content}`,
      `用户问题：${parsed.data.question}`,
      "可用长期记忆列表：",
      ...memories.map((item) => `- id=${item.id}; type=${item.type}; confidence=${item.confidence}; content=${item.content}`),
      "请返回 JSON：{ answer: string, memoryRefs: [{ id: string, reason: string }] }",
    ].join("\n"),
    temperature: 0.15,
  }));

  const memoryMap = new Map(memories.map((item) => [item.id, item]));
  const memoryRefs = result.memoryRefs
    .map((item) => {
      const memory = memoryMap.get(item.id);
      if (!memory) return null;
      return {
        id: memory.id,
        type: memory.type,
        content: memory.content,
        confidence: memory.confidence,
        reason: item.reason,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return NextResponse.json({ ok: true, answer: result.answer, memoryRefs });
}
