import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readSessionValue, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().min(1, "昵称不能为空").max(50, "昵称过长"),
});

async function requireUser() {
  const cookieStore = await cookies();
  const session = readSessionValue(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session?.userId) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
  });
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false, message: "未登录或账号不存在" }, { status: 401 });
  return NextResponse.json({ ok: true, user });
}

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ ok: false, message: "未登录或账号不存在" }, { status: 401 });

  const body = await request.json();
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message || "参数不合法" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name.trim() },
    select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, user: updated, message: "资料已更新" });
}
