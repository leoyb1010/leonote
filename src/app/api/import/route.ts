import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import net from "node:net";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ensureProject, requireOwnedNote, syncNoteTags, toNoteDTO } from "@/lib/server-notes";
import { organizeImportedContent } from "@/lib/import-organizer";

const MAX_HTML_BYTES = 512_000;
const MAX_IMPORT_FILE_BYTES = 2 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_IMPORT_FILE_BYTES + 128 * 1024;
const REQUEST_TIMEOUT_MS = 5000;
const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal"]);

const jsonArraySchema = z.array(z.object({
  title: z.string().min(1),
  content: z.string().default(""),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  projectName: z.string().optional(),
}));
const jsonExportSchema = z.object({ notes: jsonArraySchema });

async function createImportedNote(tx: Prisma.TransactionClient, userId: string, data: { title: string; content: string; excerpt?: string; tags?: string[]; projectName?: string }) {
  const project = await ensureProject(userId, data.projectName, tx);
  const note = await tx.note.create({
    data: {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || data.content.slice(0, 120),
      userId,
      projectId: project?.id ?? null,
    },
  });
  await syncNoteTags(note.id, userId, data.tags ?? [], tx);
  return note.id;
}

function isBlockedIp(ip: string) {
  if (net.isIP(ip) === 4) return ip.startsWith("10.") || ip.startsWith("127.") || ip.startsWith("169.254.") || ip.startsWith("172.") || ip.startsWith("192.168.");
  if (net.isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80");
  }
  return true;
}

async function assertSafeUrl(raw: string) {
  const target = new URL(raw);
  if (!["http:", "https:"].includes(target.protocol)) throw new Error("仅支持 http/https 链接");
  if (BLOCKED_HOSTS.has(target.hostname.toLowerCase())) throw new Error("不允许访问本地或保留地址");
  const resolved = await lookup(target.hostname, { all: true });
  if (!resolved.length || resolved.some((item) => isBlockedIp(item.address))) throw new Error("不允许访问内网或保留地址");
  return target;
}

async function fetchLinkSummary(raw: string) {
  const target = await assertSafeUrl(raw);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(target.toString(), { redirect: "follow", signal: controller.signal, headers: { "User-Agent": "LeonoteBot/1.0" } });
    if (!res.ok) throw new Error("内容不可访问");
    const html = (await res.text()).slice(0, MAX_HTML_BYTES);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || target.hostname;
    const summary = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000);
    return { target, title, summary };
  } finally { clearTimeout(timer); }
}

async function applyToExistingNote({ noteId, userId, content, mode }: { noteId: string; userId: string; content: string; mode: string }) {
  const note = await requireOwnedNote(noteId, userId);
  if (!note) throw new Error("目标笔记不存在");
  const nextContent = mode === "replace" ? content : `${note.content}${note.content.trim() ? "\n\n" : ""}${content}`;
  const updated = await prisma.note.update({ where: { id: note.id }, data: { content: nextContent, excerpt: nextContent.slice(0, 120) }, include: { project: true, tags: { include: { tag: true } } } });
  return updated;
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) {
    return NextResponse.json({ ok: false, message: "导入失败：文件不能超过 2MB" }, { status: 413 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const link = form.get("link");
  const aiEnabled = form.get("aiEnabled") === "1";
  const keepOriginal = form.get("keepOriginal") === "1";
  const mode = typeof form.get("mode") === "string" ? String(form.get("mode")) : "standalone";
  const prompt = typeof form.get("prompt") === "string" ? String(form.get("prompt")).trim() : "";
  const noteId = typeof form.get("noteId") === "string" ? String(form.get("noteId")) : "";

  const buildContent = async (titleHint: string, rawContent: string, sourceType: string, sourceUrl?: string) => {
    const organized = aiEnabled ? await organizeImportedContent(userId, { titleHint, content: `${prompt ? `整理要求：${prompt}\n\n` : ""}${rawContent}`, sourceType, sourceUrl }) : {
      title: titleHint,
      excerpt: rawContent.slice(0, 120) || "暂无摘要",
      cleanedContent: rawContent,
      tags: ["导入"],
      projectName: "",
      sourceType,
      actionItems: [],
      memoryCandidates: [],
    };
    const finalContent = keepOriginal && aiEnabled ? `# AI整理版\n\n${organized.cleanedContent}\n\n---\n\n# 原文保留\n\n${rawContent}` : organized.cleanedContent;
    return { organized, finalContent };
  };

  if (typeof link === "string" && link.trim()) {
    try {
      const { target, title, summary } = await fetchLinkSummary(link.trim());
      const raw = `${title}\n\n来源：${target.toString()}\n\n${summary}`;
      const { organized, finalContent } = await buildContent(title, raw, "link", target.toString());
      if (noteId && mode !== "standalone") {
        const updated = await applyToExistingNote({ noteId, userId, content: finalContent, mode });
        return NextResponse.json({ ok: true, message: "已导入到当前笔记", content: updated.content, note: toNoteDTO(updated) });
      }
      const refreshed = await prisma.$transaction(async (tx) => {
        const project = organized.projectName ? await ensureProject(userId, organized.projectName, tx) : null;
        const note = await tx.note.create({
          data: { title: organized.title, content: finalContent, excerpt: organized.excerpt, userId, projectId: project?.id ?? null },
        });
        await syncNoteTags(note.id, userId, organized.tags.length ? organized.tags : ["导入", "链接", target.hostname], tx);
        return tx.note.findUniqueOrThrow({ where: { id: note.id }, include: { project: true, tags: { include: { tag: true } } } });
      });
      return NextResponse.json({ ok: true, message: "链接已整理并导入", note: toNoteDTO(refreshed) });
    } catch (error) {
      return NextResponse.json({ ok: false, message: error instanceof Error ? `链接导入失败：${error.message}` : "链接导入失败" }, { status: 400 });
    }
  }

  if (!(file instanceof File)) return NextResponse.json({ ok: false, message: "请选择导入文件或填写链接" }, { status: 400 });
  if (file.size > MAX_IMPORT_FILE_BYTES) return NextResponse.json({ ok: false, message: "导入失败：文件不能超过 2MB" }, { status: 413 });
  const lower = file.name.toLowerCase();

  if (lower.endsWith(".json")) {
    const text = await file.text();
    let parsed: z.infer<typeof jsonArraySchema>;
    try {
      const raw = JSON.parse(text);
      parsed = Array.isArray(raw) ? jsonArraySchema.parse(raw) : jsonExportSchema.parse(raw).notes;
    } catch {
      return NextResponse.json({ ok: false, message: "JSON 导入失败：文件结构不合法" }, { status: 400 });
    }
    const createdIds = await prisma.$transaction(async (tx) => {
      const ids: string[] = [];
      for (const item of parsed) {
        const { organized, finalContent } = await buildContent(item.title, item.content, "import");
        ids.push(await createImportedNote(tx, userId, { title: organized.title, content: finalContent, excerpt: organized.excerpt, tags: organized.tags, projectName: organized.projectName }));
      }
      return ids;
    });
    return NextResponse.json({ ok: true, count: createdIds.length, noteId: createdIds[0] ?? null, message: `已导入 ${createdIds.length} 条笔记` });
  }

  if (lower.endsWith(".md") || lower.endsWith(".txt") || lower.endsWith(".html")) {
    const text = await file.text();
    const title = file.name.replace(/\.(md|txt|html)$/i, "") || "导入笔记";
    const typeTag = lower.endsWith(".md") ? "Markdown" : lower.endsWith(".txt") ? "文本" : "网页";
    const content = lower.endsWith(".html") ? text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : text;
    const { organized, finalContent } = await buildContent(title, content, lower.endsWith(".md") ? "markdown" : "text");
    if (noteId && mode !== "standalone") {
      const updated = await applyToExistingNote({ noteId, userId, content: finalContent, mode });
      return NextResponse.json({ ok: true, message: "已导入到当前笔记", content: updated.content, note: toNoteDTO(updated) });
    }
    const refreshed = await prisma.$transaction(async (tx) => {
      const project = organized.projectName ? await ensureProject(userId, organized.projectName, tx) : null;
      const note = await tx.note.create({ data: { title: organized.title, content: finalContent, excerpt: organized.excerpt, userId, projectId: project?.id ?? null } });
      await syncNoteTags(note.id, userId, organized.tags.length ? organized.tags : ["导入", typeTag], tx);
      return tx.note.findUniqueOrThrow({ where: { id: note.id }, include: { project: true, tags: { include: { tag: true } } } });
    });
    return NextResponse.json({ ok: true, message: "文件已整理并导入", note: toNoteDTO(refreshed) });
  }

  return NextResponse.json({ ok: false, message: "导入失败：当前支持 JSON / Markdown / TXT / HTML / 链接" }, { status: 400 });
}
