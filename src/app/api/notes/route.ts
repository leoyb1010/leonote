import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ensureProject, listNotes, syncNoteTags, toNoteDTO } from "@/lib/server-notes";
import { guardUserWriteRequest } from "@/lib/request-guard";

const schema = z.object({
  title: z.string().min(1),
  content: z.string().default(""),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  projectName: z.string().optional(),
  projectId: z.string().optional(),
});

async function resolveProjectId(userId: string, projectId?: string | null, projectName?: string) {
  if (projectName?.trim()) {
    const project = await ensureProject(userId, projectName);
    return project?.id ?? null;
  }
  if (!projectId) return null;
  const ownedProject = await prisma.project.findFirst({ where: { id: projectId, userId }, select: { id: true } });
  if (!ownedProject) throw new Error("project-not-owned");
  return ownedProject.id;
}

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "active";
  const rawQ = searchParams.get("q")?.trim();
  const q = rawQ && rawQ.length >= 2 ? rawQ : undefined;
  const tag = searchParams.get("tag") ?? undefined;
  const projectId = searchParams.get("projectId") ?? undefined;

  if (rawQ && rawQ.length < 2 && !tag && !projectId && status === "active") {
    return NextResponse.json({ ok: true, notes: [] });
  }

  const notes = await listNotes(userId, { status, q, tag, projectId });
  return NextResponse.json({ ok: true, notes: notes.map(toNoteDTO) });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "notes");
  if (guarded) return guarded;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "参数不合法" }, { status: 400 });

  let projectId: string | null;
  try {
    projectId = await resolveProjectId(userId, parsed.data.projectId || null, parsed.data.projectName);
  } catch {
    return NextResponse.json({ ok: false, message: "项目不存在或不属于当前账号" }, { status: 400 });
  }

  const note = await prisma.note.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      excerpt: parsed.data.excerpt || parsed.data.content.slice(0, 120),
      userId,
      projectId,
    },
    include: { project: true, tags: { include: { tag: true } } },
  });

  await syncNoteTags(note.id, userId, parsed.data.tags);
  const refreshed = await prisma.note.findUniqueOrThrow({ where: { id: note.id }, include: { project: true, tags: { include: { tag: true } } } });
  return NextResponse.json({ ok: true, note: toNoteDTO(refreshed) });
}
