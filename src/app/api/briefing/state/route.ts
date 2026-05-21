import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { guardUserWriteRequest } from "@/lib/request-guard";

const schema = z.object({
  itemId: z.string().min(1),
  isRead: z.boolean().optional(),
  isFavorited: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "briefing-state");
  if (guarded) return guarded;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ ok: false, message: "参数不合法" }, { status: 400 });

  const exists = await prisma.newsItem.findUnique({ where: { id: parsed.data.itemId }, select: { id: true } });
  if (!exists) return NextResponse.json({ ok: false, message: "资讯不存在" }, { status: 404 });

  // Ownership is enforced by the @@unique([userId, itemId]) compound key on
  // UserBriefingState — the session userId is baked into the upsert where clause.
  const state = await prisma.userBriefingState.upsert({
    where: { userId_itemId: { userId, itemId: parsed.data.itemId } },
    create: {
      userId,
      itemId: parsed.data.itemId,
      isRead: parsed.data.isRead ?? false,
      isFavorited: parsed.data.isFavorited ?? false,
      readAt: parsed.data.isRead ? new Date() : null,
    },
    update: {
      ...(typeof parsed.data.isRead === "boolean" ? { isRead: parsed.data.isRead, readAt: parsed.data.isRead ? new Date() : null } : {}),
      ...(typeof parsed.data.isFavorited === "boolean" ? { isFavorited: parsed.data.isFavorited } : {}),
    },
  });

  return NextResponse.json({
    ok: true,
    state: {
      isRead: state.isRead,
      isFavorited: state.isFavorited,
      isImported: state.isImported,
      importedNoteId: state.importedNoteId,
    },
  });
}
