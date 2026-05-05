import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSessionValue,
  getSessionCookieOptions,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "参数不合法" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const ipLimit = checkRateLimit(`login:ip:${ip}`, 20, 5 * 60 * 1000);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { ok: false, message: "请求过于频繁，请稍后再试" },
      { status: 429 },
    );
  }

  const emailLimit = checkRateLimit(`login:email:${email}`, 10, 5 * 60 * 1000);
  if (!emailLimit.ok) {
    return NextResponse.json(
      { ok: false, message: "请求过于频繁，请稍后再试" },
      { status: 429 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { ok: false, message: "邮箱或密码错误" },
      { status: 401 },
    );
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { ok: false, message: "邮箱或密码错误" },
      { status: 401 },
    );
  }

  const token = createSessionValue(user.id, user.tokenVersion);
  const [, expRaw] = token.split(".");
  const exp = Number(expRaw);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, getSessionCookieOptions(exp));

  return NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email },
  });
}
