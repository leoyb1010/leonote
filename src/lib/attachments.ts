import crypto from "node:crypto";
import path from "node:path";

export const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

const DEFAULT_ATTACHMENT_MIME = "application/octet-stream";
const MIME_RE = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/i;
const ACTIVE_CONTENT_MIME_TYPES = new Set([
  "application/javascript",
  "application/xhtml+xml",
  "application/xml",
  "image/svg+xml",
  "text/html",
  "text/javascript",
  "text/xml",
]);
const INLINE_ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/avif",
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function getAttachmentRoot() {
  return path.join(process.env.LEONOTE_DATA_DIR || path.join(process.cwd(), "data"), "attachments");
}

export function sanitizeAttachmentFilename(filename: string) {
  const fallback = "attachment";
  const base = path.basename(filename || fallback).replace(/[^\w.\-\u4e00-\u9fa5]+/g, "-");
  return base.replace(/^-+|-+$/g, "") || fallback;
}

export function sanitizeAttachmentMimeType(mimeType: string | null | undefined) {
  const normalized = (mimeType ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
  if (!normalized || !MIME_RE.test(normalized)) return DEFAULT_ATTACHMENT_MIME;
  if (ACTIVE_CONTENT_MIME_TYPES.has(normalized)) return DEFAULT_ATTACHMENT_MIME;
  return normalized;
}

export function isInlineAttachmentMimeType(mimeType: string | null | undefined) {
  return INLINE_ATTACHMENT_MIME_TYPES.has(sanitizeAttachmentMimeType(mimeType));
}

export function attachmentContentDisposition(input: {
  filename: string;
  mimeType: string | null | undefined;
}) {
  const disposition = isInlineAttachmentMimeType(input.mimeType) ? "inline" : "attachment";
  return `${disposition}; filename*=UTF-8''${encodeURIComponent(sanitizeAttachmentFilename(input.filename))}`;
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
