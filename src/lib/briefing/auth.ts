import { NextResponse } from "next/server";

export function requireBriefingCron(request: Request) {
  const expected = process.env.BRIEFING_CRON_TOKEN;
  if (!expected) {
    return NextResponse.json({ ok: false, message: "BRIEFING_CRON_TOKEN 未配置" }, { status: 500 });
  }

  const got = request.headers.get("x-briefing-cron-token") || request.headers.get("Authorization")?.replace("Bearer ", "");
  if (got !== expected) {
    return NextResponse.json({ ok: false, message: "无权触发任务" }, { status: 401 });
  }

  return null;
}
