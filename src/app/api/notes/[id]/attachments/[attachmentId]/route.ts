import { readFile, unlink } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { resolveAttachmentPath } from "@/lib/attachments";
import { guardUserWriteRequest } from "@/lib/request-guard";

export const runtime = "nodejs";

async function findOwnedAttachment(noteId: string, attachmentId: string, userId: string) {
  return prisma.noteAttachment.findFirst({
    where: {
      id: attachmentId,
      noteId,
      userId,
      note: { userId },
    },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { id, attachmentId } = await context.params;
  const attachment = await findOwnedAttachment(id, attachmentId, userId);
  if (!attachment) return NextResponse.json({ ok: false, message: "附件不存在" }, { status: 404 });

  try {
    const file = await readFile(resolveAttachmentPath(attachment.storagePath));
    return new NextResponse(file, {
      headers: {
        "Content-Type": attachment.mimeType || "application/octet-stream",
        "Content-Length": String(attachment.size),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, message: "附件文件缺失" }, { status: 404 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "attachments", { limit: 120, windowMs: 60_000 });
  if (guarded) return guarded;

  const { id, attachmentId } = await context.params;
  const attachment = await findOwnedAttachment(id, attachmentId, userId);
  if (!attachment) return NextResponse.json({ ok: false, message: "附件不存在" }, { status: 404 });

  await prisma.noteAttachment.delete({ where: { id: attachment.id } });
  await unlink(resolveAttachmentPath(attachment.storagePath)).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
