import crypto from "node:crypto";
import { NextResponse } from "next/server";

export function requireBriefingCron(request: Request) {
  const expected = process.env.BRIEFING_CRON_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { ok: false, message: "BRIEFING_CRON_TOKEN 未配置" },
      { status: 503 },
    );
  }

  const headerToken = request.headers.get("x-briefing-cron-token")?.trim();
  const authorization = request.headers.get("authorization") ?? "";
  const bearerToken = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
  const supplied = headerToken || bearerToken;

  if (!supplied || !constantTimeEqual(expected, supplied)) {
    return NextResponse.json(
      { ok: false, message: "未授权的定时任务请求" },
      { status: 401 },
    );
  }

  return null;
}

function constantTimeEqual(expected: string, supplied: string) {
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
