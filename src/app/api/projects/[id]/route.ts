import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugifyProjectName } from "@/lib/server-notes";
import { getSessionUserId } from "@/lib/session";
import { guardUserWriteRequest } from "@/lib/request-guard";
import { parseJsonBody } from "@/lib/http";

const schema = z.object({
  name: z.string().trim().min(1, "项目名称不能为空"),
  description: z.string().optional().default(""),
  status: z.string().trim().min(1).max(32).optional(),
  color: z.string().trim().min(1).max(32).optional(),
});

async function getOwnedProject(userId: string, id: string) {
  return prisma.project.findFirst({ where: { id, userId } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "projects");
  if (guarded) return guarded;

  const { id } = await params;
  const project = await getOwnedProject(userId, id);
  if (!project) return NextResponse.json({ ok: false, message: "项目不存在" }, { status: 404 });

  const body = await parseJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = schema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ ok: false, message: parsed.error.issues[0]?.message || "参数错误" }, { status: 400 });

  const name = parsed.data.name.trim();
  const description = parsed.data.description?.trim() || "";
  const nextSlugBase = slugifyProjectName(name);
  let slug = project.slug;
  if (name !== project.name) {
    slug = nextSlugBase;
    let index = 1;
    while (await prisma.project.findFirst({ where: { userId, slug, NOT: { id } } })) {
      index += 1;
      slug = `${nextSlugBase}-${index}`;
    }
  }

  const updated = await prisma.project.update({
    where: { id },
    data: {
      name,
      description,
      slug,
      status: parsed.data.status?.trim() || project.status,
      color: parsed.data.color?.trim() || project.color,
    },
  });

  return NextResponse.json({ ok: true, project: updated });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "projects");
  if (guarded) return guarded;

  const { id } = await params;
  const project = await getOwnedProject(userId, id);
  if (!project) return NextResponse.json({ ok: false, message: "项目不存在" }, { status: 404 });

  await prisma.$transaction([
    prisma.note.updateMany({ where: { userId, projectId: id }, data: { projectId: null } }),
    prisma.project.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
