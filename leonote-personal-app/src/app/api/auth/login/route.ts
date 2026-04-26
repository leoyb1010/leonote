import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSessionValue, getSessionCookieOptions, SESSION_COOKIE, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  identifier: z.string().min(1).optional(),
  email: z.string().min(1).optional(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "参数不合法" }, { status: 400 });
  }

  const identifier = (parsed.data.identifier || parsed.data.email || "").trim();
  if (!identifier) {
    return NextResponse.json({ ok: false, message: "请输入邮箱或用户名" }, { status: 400 });
  }

  const normalized = identifier.toLowerCase();
  const user = normalized.includes("@")
    ? await prisma.user.findUnique({ where: { email: normalized } })
    : await prisma.user.findFirst({
        where: {
          OR: [
            { name: identifier },
            { email: { startsWith: `${normalized}@` } },
          ],
        },
      });
  if (!user) {
    return NextResponse.json({ ok: false, message: "邮箱或密码错误" }, { status: 401 });
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ ok: false, message: "邮箱或密码错误" }, { status: 401 });
  }

  const token = createSessionValue(user.id);
  const session = token.split(".");
  const exp = Number(session[1]);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, getSessionCookieOptions(exp));

  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
}
