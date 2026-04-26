import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(1).max(40),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "参数不合法" }, { status: 400 });
  }

  const existingCount = await prisma.user.count();
  if (existingCount > 0) {
    return NextResponse.json({ ok: false, message: "当前版本暂未开放公开注册" }, { status: 403 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingUser) {
    return NextResponse.json({ ok: false, message: "该邮箱已被使用" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email: parsed.data.email.trim().toLowerCase(),
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } });
}
