import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import {
  createAttachmentStoragePath,
  MAX_ATTACHMENT_SIZE,
  resolveAttachmentPath,
  sanitizeAttachmentFilename,
  sanitizeAttachmentMimeType,
  toAttachmentDTO,
} from "@/lib/attachments";
import { safeFetch } from "@/lib/safe-url";

export type AgentLink = { url: string; label?: string };

export function buildNoteMarkdown(input: {
  source: string;
  summary?: string;
  bodyMarkdown?: string;
  links?: AgentLink[];
  now?: Date;
}) {
  const parts: string[] = [];
  const createdAt = (input.now ?? new Date()).toLocaleString("zh-CN");
  parts.push(`> 📥 来自 ${input.source} · ${createdAt}`);

  const summary = input.summary?.trim();
  if (summary) parts.push(`\n## 摘要\n${summary}`);

  const body = input.bodyMarkdown?.trim();
  if (body) parts.push(`\n${body}`);

  const links = input.links ?? [];
  if (links.length) {
    parts.push("\n## 🔗 相关链接");
    for (const link of links) {
      parts.push(`- [${link.label?.trim() || link.url}](${link.url})`);
    }
  }

  return parts.join("\n");
}

export async function ingestRemoteAttachment(
  userId: string,
  noteId: string,
  attachment: { url: string; filename?: string; type?: string },
) {
  const { response } = await safeFetch(attachment.url);
  if (!response.ok) throw new Error("remote-attachment-fetch-failed");

  const contentLength = Number(response.headers.get("content-length") ?? "");
  if (Number.isFinite(contentLength) && contentLength > MAX_ATTACHMENT_SIZE) {
    throw new Error("remote-attachment-too-large");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length <= 0) throw new Error("remote-attachment-empty");
  if (buffer.length > MAX_ATTACHMENT_SIZE) throw new Error("remote-attachment-too-large");

  const fallbackName = attachment.type ? `${attachment.type}-attachment` : "attachment";
  const filename = sanitizeAttachmentFilename(attachment.filename || fallbackName);
  const storagePath = createAttachmentStoragePath(userId, noteId, filename);
  const absolutePath = resolveAttachmentPath(storagePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);

  const created = await prisma.noteAttachment.create({
    data: {
      noteId,
      userId,
      filename,
      mimeType: sanitizeAttachmentMimeType(response.headers.get("content-type")),
      size: buffer.length,
      storagePath,
    },
  });

  return toAttachmentDTO(created);
}
