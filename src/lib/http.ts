import { NextResponse } from "next/server";

export type JsonBodyResult =
  | { ok: true; data: unknown }
  | { ok: false; response: NextResponse };

export async function parseJsonBody(request: Request): Promise<JsonBodyResult> {
  try {
    return { ok: true, data: await request.json() };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, message: "请求 JSON 格式不合法" }, { status: 400 }),
    };
  }
}
