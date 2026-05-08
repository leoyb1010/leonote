import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { guardUserWriteRequest } from "@/lib/request-guard";
import { importNewsItemToNote, importTodayDigestToNote } from "@/lib/briefing/import-note";

const schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("item"), itemId: z.string().min(1) }),
  z.object({ type: z.literal("digest") }),
]);

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "briefing-import", { limit: 20, windowMs: 60_000 });
  if (guarded) return guarded;

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ ok: false, message: "参数不合法" }, { status: 400 });

  try {
    const note = parsed.data.type === "item"
      ? await importNewsItemToNote(userId, parsed.data.itemId)
      : await importTodayDigestToNote(userId);

    return NextResponse.json({ ok: true, noteId: note.id });
  } catch {
    return NextResponse.json({ ok: false, message: "导入失败" }, { status: 500 });
  }
}
