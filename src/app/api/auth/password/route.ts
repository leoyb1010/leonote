import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  hashPassword,
  readSessionValue,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { guardUserWriteRequest } from "@/lib/request-guard";

const schema = z.object({
  currentPassword: z.string().min(1, "请输入当前密码"),
  newPassword: z.string().min(8, "新密码至少 8 位"),
});

async function requireUserRecord() {
  const cookieStore = await cookies();
  const session = readSessionValue(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user) return null;
  if (user.tokenVersion !== session.tokenVersion) return null;

  return user;
}

export async function POST(request: Request) {
  const user = await requireUserRecord();
  if (!user)
    return NextResponse.json(
      { ok: false, message: "未登录或账号不存在" },
      { status: 401 },
    );
  const guarded = guardUserWriteRequest(request, user.id, "password", { limit: 10 });
  if (guarded) return guarded;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message || "参数不合法" },
      { status: 400 },
    );

  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok)
    return NextResponse.json(
      { ok: false, message: "当前密码错误" },
      { status: 400 },
    );
  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return NextResponse.json(
      { ok: false, message: "新密码不能与当前密码相同" },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      tokenVersion: { increment: 1 },
    },
  });

  return NextResponse.json({ ok: true, message: "密码已更新，请重新登录" });
}
