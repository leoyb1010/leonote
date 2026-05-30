import crypto from "node:crypto";
import { NextResponse } from "next/server";

function constantTimeEqual(expected: string, supplied: string) {
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function requireCronToken(request: Request, input: {
  envName: string;
  headerName: string;
  missingMessage?: string;
  unauthorizedMessage?: string;
}) {
  const expected = process.env[input.envName];
  if (!expected) {
    return NextResponse.json(
      { ok: false, message: input.missingMessage ?? `${input.envName} 未配置` },
      { status: 503 },
    );
  }

  const headerToken = request.headers.get(input.headerName)?.trim();
  const authorization = request.headers.get("authorization") ?? "";
  const bearerToken = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim()
    : "";
  const supplied = headerToken || bearerToken;

  if (!supplied || !constantTimeEqual(expected, supplied)) {
    return NextResponse.json(
      { ok: false, message: input.unauthorizedMessage ?? "未授权的定时任务请求" },
      { status: 401 },
    );
  }

  return null;
}
