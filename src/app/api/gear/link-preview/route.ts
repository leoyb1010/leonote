import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchGearLinkPreview } from "@/lib/gear-link";
import { guardUserWriteRequest } from "@/lib/request-guard";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const schema = z.object({
  url: z.string().trim().url().max(2000),
});

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const guarded = guardUserWriteRequest(request, userId, "gear-link-preview", { limit: 30, windowMs: 60_000 });
  if (guarded) return guarded;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "贴一个完整商品链接再读取" }, { status: 400 });
  }

  try {
    const preview = await fetchGearLinkPreview(parsed.data.url);
    return NextResponse.json({ ok: true, preview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "链接读取失败，先手动录入";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
