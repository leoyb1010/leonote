import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { guardUserWriteRequest } from "@/lib/request-guard";
import {
  createAttachmentStoragePath,
  MAX_ATTACHMENT_SIZE,
  resolveAttachmentPath,
  sanitizeAttachmentMimeType,
  sanitizeAttachmentFilename,
  toAttachmentDTO,
} from "@/lib/attachments";

export const runtime = "nodejs";

async function requireOwnedNoteForAttachment(noteId: string, userId: string) {
  return prisma.note.findFirst({ where: { id: noteId, userId, deletedAt: null }, select: { id: true } });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { id } = await context.params;
  const note = await requireOwnedNoteForAttachment(id, userId);
  if (!note) return NextResponse.json({ ok: false, message: "笔记不存在" }, { status: 404 });

  const attachments = await prisma.noteAttachment.findMany({
    where: { noteId: id, userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ ok: true, attachments: attachments.map(toAttachmentDTO) });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "attachments", { limit: 120, windowMs: 60_000 });
  if (guarded) return guarded;

  const { id } = await context.params;
  const note = await requireOwnedNoteForAttachment(id, userId);
  if (!note) return NextResponse.json({ ok: false, message: "请先保存笔记，再添加附件" }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "请选择要上传的文件" }, { status: 400 });
  }
  if (file.size <= 0) {
    return NextResponse.json({ ok: false, message: "文件内容为空" }, { status: 400 });
  }
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return NextResponse.json({ ok: false, message: "单个附件不能超过 25MB" }, { status: 413 });
  }

  const filename = sanitizeAttachmentFilename(file.name);
  const storagePath = createAttachmentStoragePath(userId, id, filename);
  const absolutePath = resolveAttachmentPath(storagePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

  const attachment = await prisma.noteAttachment.create({
    data: {
      noteId: id,
      userId,
      filename,
      mimeType: sanitizeAttachmentMimeType(file.type),
      size: file.size,
      storagePath,
    },
  });

  return NextResponse.json({ ok: true, attachment: toAttachmentDTO(attachment) });
}
