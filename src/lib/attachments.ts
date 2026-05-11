import crypto from "node:crypto";
import path from "node:path";

export const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

export function getAttachmentRoot() {
  return path.join(process.env.LEONOTE_DATA_DIR || path.join(process.cwd(), "data"), "attachments");
}

export function sanitizeAttachmentFilename(filename: string) {
  const fallback = "attachment";
  const base = path.basename(filename || fallback).replace(/[^\w.\-\u4e00-\u9fa5]+/g, "-");
  return base.replace(/^-+|-+$/g, "") || fallback;
}

export function createAttachmentStoragePath(userId: string, noteId: string, filename: string) {
  const safeFilename = sanitizeAttachmentFilename(filename);
  const token = crypto.randomBytes(10).toString("hex");
  return path.join(userId, noteId, `${token}-${safeFilename}`);
}

export function resolveAttachmentPath(storagePath: string) {
  const root = getAttachmentRoot();
  const resolved = path.resolve(root, storagePath);
  const normalizedRoot = path.resolve(root);
  if (!resolved.startsWith(`${normalizedRoot}${path.sep}`)) {
    throw new Error("invalid-attachment-path");
  }
  return resolved;
}

export function toAttachmentDTO(attachment: {
  id: string;
  noteId: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}) {
  return {
    id: attachment.id,
    noteId: attachment.noteId,
    filename: attachment.filename,
    mimeType: attachment.mimeType,
    size: attachment.size,
    createdAt: attachment.createdAt,
    url: `/api/notes/${attachment.noteId}/attachments/${attachment.id}`,
  };
}
