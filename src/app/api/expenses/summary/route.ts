import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getExpenseSummary } from "@/lib/expense";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const summary = await getExpenseSummary(userId);
  return NextResponse.json({ ok: true, summary });
}
