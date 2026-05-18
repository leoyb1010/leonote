import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ensureProject, requireOwnedNote, toNoteDTO } from "@/lib/server-notes";
import { updateNoteWithRevision } from "@/lib/note-mutations";
import { guardUserWriteRequest } from "@/lib/request-guard";
import { ensureNoteFtsReady } from "@/lib/note-fts";

const schema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
  projectId: z.string().nullable().optional(),
  projectName: z.string().optional(),
});

async function resolveProjectId(userId: string, projectId: string | null | undefined, projectName?: string) {
  if (projectName?.trim()) {
    const project = await ensureProject(userId, projectName);
    return project?.id ?? null;
  }
  if (projectId === undefined) return undefined;
  if (projectId === null) return null;
  const ownedProject = await prisma.project.findFirst({ where: { id: projectId, userId }, select: { id: true } });
  if (!ownedProject) throw new Error("project-not-owned");
  return ownedProject.id;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { id } = await context.params;
  const note = await requireOwnedNote(id, userId);
  if (!note) return NextResponse.json({ ok: false, message: "笔记不存在" }, { status: 404 });

  return NextResponse.json({ ok: true, note: toNoteDTO(note) });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "notes", { limit: 180 });
  if (guarded) return guarded;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "参数不合法" }, { status: 400 });

  const existing = await requireOwnedNote(id, userId);
  if (!existing) return NextResponse.json({ ok: false, message: "笔记不存在" }, { status: 404 });

  let projectId: string | null | undefined;
  try {
    projectId = await resolveProjectId(userId, parsed.data.projectId, parsed.data.projectName);
  } catch {
    return NextResponse.json({ ok: false, message: "项目不存在或不属于当前账号" }, { status: 400 });
  }

  const reason = request.headers.get("x-leonote-save-reason") || "save";

  try {
    await ensureNoteFtsReady();
  } catch {
    return NextResponse.json({ ok: false, message: "全文索引初始化失败，请稍后再试" }, { status: 500 });
  }

  const updated = await updateNoteWithRevision(
    { id: existing.id, title: existing.title, content: existing.content, excerpt: existing.excerpt, userId },
    {
      title: parsed.data.title,
      content: parsed.data.content,
      excerpt: parsed.data.excerpt,
      isFavorite: parsed.data.favorite,
      isPinned: parsed.data.pinned,
      isArchived: parsed.data.archived,
      projectId,
      tags: parsed.data.tags,
    },
    reason,
  );

  return NextResponse.json({ ok: true, note: toNoteDTO(updated) });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "notes");
  if (guarded) return guarded;

  const { id } = await context.params;
  const existing = await requireOwnedNote(id, userId);
  if (!existing) return NextResponse.json({ ok: false, message: "笔记不存在" }, { status: 404 });
  if (!existing.deletedAt) return NextResponse.json({ ok: false, message: "请先移入回收站" }, { status: 400 });

  try {
    await ensureNoteFtsReady();
  } catch {
    return NextResponse.json({ ok: false, message: "全文索引初始化失败，请稍后再试" }, { status: 500 });
  }

  await prisma.note.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
