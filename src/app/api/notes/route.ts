import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ensureProject, listNotes, syncNoteTags, toNoteDTO } from "@/lib/server-notes";
import { guardUserWriteRequest } from "@/lib/request-guard";
import { ensureNoteFtsReady } from "@/lib/note-fts";
import { parseJsonBody } from "@/lib/http";

const schema = z.object({
  title: z.string().min(1),
  content: z.string().default(""),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  projectName: z.string().optional(),
  projectId: z.string().nullable().optional(),
  source: z.string().max(120).optional(),
});

type DbClient = typeof prisma | Prisma.TransactionClient;

async function resolveProjectId(userId: string, projectId?: string | null, projectName?: string, db: DbClient = prisma) {
  if (projectName?.trim()) {
    const project = await ensureProject(userId, projectName, db);
    return project?.id ?? null;
  }
  if (!projectId) return null;
  const ownedProject = await db.project.findFirst({ where: { id: projectId, userId }, select: { id: true } });
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
  const guarded = guardUserWriteRequest(request, userId, "notes", { limit: 180 });
  if (guarded) return guarded;

  const body = await parseJsonBody(request);
  if (!body.ok) return body.response;
  const parsed = schema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "参数不合法" }, { status: 400 });

  try {
    await ensureNoteFtsReady();
  } catch {
    return NextResponse.json({ ok: false, message: "全文索引初始化失败，请稍后再试" }, { status: 500 });
  }

  let note;
  try {
    note = await prisma.$transaction(async (tx) => {
      const projectId = await resolveProjectId(userId, parsed.data.projectId || null, parsed.data.projectName, tx);
      const created = await tx.note.create({
        data: {
          title: parsed.data.title,
          content: parsed.data.content,
          excerpt: parsed.data.excerpt || parsed.data.content.slice(0, 120),
          source: parsed.data.source,
          userId,
          projectId,
        },
      });

      await syncNoteTags(created.id, userId, parsed.data.tags, tx);

      return tx.note.findUniqueOrThrow({ where: { id: created.id }, include: { project: true, tags: { include: { tag: true } } } });
    });
  } catch {
    return NextResponse.json({ ok: false, message: "项目不存在或不属于当前账号" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, note: toNoteDTO(note) });
}
