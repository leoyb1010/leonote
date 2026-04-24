import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import net from "node:net";
import { z } from "zod";
import { readSessionValue, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureProject, syncNoteTags, toNoteDTO } from "@/lib/server-notes";

const MAX_HTML_BYTES = 512_000;
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

async function requireUserId() {
  const cookieStore = await cookies();
  const session = readSessionValue(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session?.userId) return null;
  return session.userId;
}

async function createImportedNote(userId: string, data: { title: string; content: string; excerpt?: string; tags?: string[]; projectName?: string }) {
  const project = await ensureProject(userId, data.projectName);
  const note = await prisma.note.create({
    data: {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt || data.content.slice(0, 120),
      userId,
      projectId: project?.id ?? null,
    },
  });
  await syncNoteTags(note.id, userId, data.tags ?? []);
  return note.id;
}

function isBlockedIp(ip: string) {
  if (net.isIP(ip) === 4) {
    return ip.startsWith("10.") || ip.startsWith("127.") || ip.startsWith("169.254.") || ip.startsWith("172.16.") || ip.startsWith("172.17.") || ip.startsWith("172.18.") || ip.startsWith("172.19.") || ip.startsWith("172.2") || ip.startsWith("172.30.") || ip.startsWith("172.31.") || ip.startsWith("192.168.");
  }
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
    const summary = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000);
    return { target, title, summary };
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const link = form.get("link");

  if (typeof link === "string" && link.trim()) {
    try {
      const { target, title, summary } = await fetchLinkSummary(link.trim());
      const note = await prisma.note.create({
        data: {
          title,
          content: `${title}\n\n来源：${target.toString()}\n\n${summary}`,
          excerpt: summary.slice(0, 120) || target.toString(),
          userId,
        },
        include: { project: true, tags: { include: { tag: true } } },
      });
      await syncNoteTags(note.id, userId, ["导入", "链接", target.hostname]);
      const refreshed = await prisma.note.findUniqueOrThrow({ where: { id: note.id }, include: { project: true, tags: { include: { tag: true } } } });
      return NextResponse.json({ ok: true, note: toNoteDTO(refreshed) });
    } catch (error) {
      return NextResponse.json({ ok: false, message: error instanceof Error ? `链接导入失败：${error.message}` : "链接导入失败" }, { status: 400 });
    }
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "请选择导入文件或填写链接" }, { status: 400 });
  }

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
    const createdIds: string[] = [];
    for (const item of parsed) createdIds.push(await createImportedNote(userId, item));
    return NextResponse.json({ ok: true, count: createdIds.length, noteId: createdIds[0] ?? null });
  }

  if (lower.endsWith(".md") || lower.endsWith(".txt") || lower.endsWith(".html")) {
    const text = await file.text();
    const title = file.name.replace(/\.(md|txt|html)$/i, "") || "导入笔记";
    const typeTag = lower.endsWith(".md") ? "Markdown" : lower.endsWith(".txt") ? "文本" : "网页";
    const content = lower.endsWith(".html") ? text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : text;
    const note = await prisma.note.create({
      data: { title, content, excerpt: content.trim().slice(0, 120) || "暂无摘要", userId },
      include: { project: true, tags: { include: { tag: true } } },
    });
    await syncNoteTags(note.id, userId, ["导入", typeTag]);
    const refreshed = await prisma.note.findUniqueOrThrow({ where: { id: note.id }, include: { project: true, tags: { include: { tag: true } } } });
    return NextResponse.json({ ok: true, note: toNoteDTO(refreshed) });
  }

  return NextResponse.json({ ok: false, message: "导入失败：当前支持 JSON / Markdown / TXT / HTML / 链接" }, { status: 400 });
}
