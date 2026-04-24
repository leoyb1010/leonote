import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readSessionValue, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugifyProjectName } from "@/lib/server-notes";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

async function requireUserId() {
  const cookieStore = await cookies();
  const session = readSessionValue(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session?.userId) return null;
  return session.userId;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId },
    include: { _count: { select: { notes: true } } },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ ok: true, projects: projects.map((item) => ({ ...item, noteCount: item._count.notes })) });
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "项目名称不能为空" }, { status: 400 });

  const baseSlug = slugifyProjectName(parsed.data.name);
  let slug = baseSlug;
  let index = 1;
  while (await prisma.project.findUnique({ where: { slug_userId: { slug, userId } } })) {
    index += 1;
    slug = `${baseSlug}-${index}`;
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || "",
      slug,
      userId,
    },
  });

  return NextResponse.json({ ok: true, project });
}
