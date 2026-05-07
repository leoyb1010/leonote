import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, message }, { status });
}

function getRequestHost(request: Request) {
  return (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  )
    .split(",")[0]
    .trim()
    .toLowerCase();
}

function getAllowedOriginHosts(request: Request) {
  const hosts = new Set<string>();
  const requestHost = getRequestHost(request);
  if (requestHost) hosts.add(requestHost);

  const publicUrl = process.env.LEONOTE_PUBLIC_URL;
  if (publicUrl) {
    try {
      hosts.add(new URL(publicUrl).host.toLowerCase());
    } catch {
      // Invalid deployment URL should not make same-origin checks fail open.
    }
  }

  return hosts;
}

export function rejectCrossOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return jsonError("请求来源不匹配", 403);
  }

  if (!getAllowedOriginHosts(request).has(originHost)) {
    return jsonError("请求来源不匹配", 403);
  }

  return null;
}

export function rejectUserWriteBurst(
  userId: string,
  scope: string,
  limit = 60,
  windowMs = 60_000,
) {
  const result = checkRateLimit(`write:${scope}:${userId}`, limit, windowMs);
  if (result.ok) return null;

  const retryAfter = Math.max(1, Math.ceil((result.retryAfterMs ?? windowMs) / 1000));
  return NextResponse.json(
    { ok: false, message: "操作有点频繁，稍后再试" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export function guardUserWriteRequest(
  request: Request,
  userId: string,
  scope: string,
  options?: { limit?: number; windowMs?: number },
) {
  return (
    rejectCrossOrigin(request) ||
    rejectUserWriteBurst(userId, scope, options?.limit, options?.windowMs)
  );
}
