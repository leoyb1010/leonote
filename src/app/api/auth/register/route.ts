import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

const schema = z.object({
  name: z.string().min(1).max(40),
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

  const existingCount = await prisma.user.count();
  const allowRegistration =
    process.env.LEONOTE_ALLOW_REGISTRATION === "true";

  if (existingCount > 0 && !allowRegistration) {
    return NextResponse.json(
      { ok: false, message: "当前版本暂未开放公开注册" },
      { status: 403 },
    );
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const ipLimit = checkRateLimit(`register:ip:${ip}`, 5, 60 * 60 * 1000);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { ok: false, message: "请求过于频繁，请稍后再试" },
      { status: 429 },
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existingUser) {
    return NextResponse.json(
      { ok: false, message: "该邮箱已被使用" },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name.trim(),
      email: parsed.data.email.trim().toLowerCase(),
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  return NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email },
  });
}
