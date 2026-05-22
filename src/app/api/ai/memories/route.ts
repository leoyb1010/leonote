import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { guardUserWriteRequest } from "@/lib/request-guard";
import { parseJsonBody } from "@/lib/http";

const schema = z.object({
  items: z.array(z.object({ content: z.string().min(1), type: z.string().min(1).default("preference"), confidence: z.number().min(0).max(1).default(0.7) })).max(12),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const items = await prisma.memoryFact.findMany({ where: { userId, isActive: true }, orderBy: [{ updatedAt: "desc" }], take: 30 });
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "ai-memories");
  if (guarded) return guarded;

  const body = await parseJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = schema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ message: "参数不合法" }, { status: 400 });

  const saved = [] as string[];
  for (const item of parsed.data.items) {
    const memory = await prisma.memoryFact.create({ data: { userId, content: item.content, type: item.type, confidence: item.confidence } });
    saved.push(memory.id);
  }
  return NextResponse.json({ ok: true, ids: saved });
}
