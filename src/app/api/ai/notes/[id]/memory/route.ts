import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { requireOwnedNote } from "@/lib/server-notes";
import { callChatJSON } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { guardUserWriteRequest } from "@/lib/request-guard";

const schema = z.object({
  items: z.array(z.object({ content: z.string().min(1), type: z.string().min(1).default("project"), confidence: z.number().min(0).max(1).default(0.7) })).max(8),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ message: "未登录" }, { status: 401 });

  const guard = guardUserWriteRequest(request, userId, "ai-memory", { limit: 15, windowMs: 60_000 });
  if (guard) return guard;

  const { id } = await context.params;
  const note = await requireOwnedNote(id, userId);
  if (!note) return NextResponse.json({ message: "笔记不存在" }, { status: 404 });

  const result = schema.parse(await callChatJSON<unknown>({
    userId,
    system: "你是长期记忆提取助手。只输出 JSON。只提取稳定、值得长期保留的信息。",
    prompt: `请从下面笔记中提取适合长期记忆的信息。类型可用：preference, profile, project, goal, habit。\n标题：${note.title}\n内容：${note.content}`,
    temperature: 0.1,
  }));

  for (const item of result.items) {
    await prisma.memoryFact.create({
      data: {
        userId,
        content: item.content,
        type: item.type,
        confidence: item.confidence,
        sourceType: "note",
        sourceId: note.id,
      },
    });
  }

  return NextResponse.json({ ok: true, items: result.items.map((item) => item.content) });
}
