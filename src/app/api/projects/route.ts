import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { slugifyProjectName } from "@/lib/server-notes";
import { guardUserWriteRequest } from "@/lib/request-guard";

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId },
    include: { _count: { select: { notes: true } } },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ ok: true, projects: projects.map((item) => ({ ...item, noteCount: item._count.notes })) });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "projects");
  if (guarded) return guarded;

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
