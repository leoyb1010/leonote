import crypto from "node:crypto";
import type { BriefingDigestSummary } from "./types";

export function stableExternalId(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);
}

const HTML_ENTITY_MAP: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": "\"",
  "&#39;": "'",
  "&apos;": "'",
};

const LOW_VALUE_LINE_RE =
  /^(url|uri|guid|id|uuid|source|author|published|fetched|score|content|description|摘要|正文|链接|来源)\s*[:=：]/i;

const BOILERPLATE_RE =
  /(cookie|subscribe|newsletter|copyright|all rights reserved|read more|点击查看|阅读全文|责任编辑|免责声明|广告|扫码|客户端|下载|更多精彩|原文链接|欢迎关注|微信公众号|微信号)/i;

export function normalizeWhitespace(input = "") {
  return input
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeBasicEntities(input: string) {
  return input.replace(/&(?:nbsp|amp|lt|gt|quot|apos);|&#39;/g, (entity) => HTML_ENTITY_MAP[entity] ?? entity);
}

export function stripHtml(input = "") {
  return decodeBasicEntities(input)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function truncate(input: string, max = 180) {
  const text = normalizeWhitespace(input);
  if (text.length <= max) return text;
  const sentenceEnd = Math.max(
    text.lastIndexOf("。", max),
    text.lastIndexOf("！", max),
    text.lastIndexOf("？", max),
    text.lastIndexOf(".", max),
  );
  const cutAt = sentenceEnd > max * 0.55 ? sentenceEnd + 1 : max;
  return `${text.slice(0, cutAt).trim()}…`;
}

export function extractImageUrl(item: Record<string, unknown>) {
  const enclosure = item.enclosure as { url?: string } | undefined;
  if (enclosure?.url) return enclosure.url;

  const mediaContent = item["media:content"] as { $?: { url?: string } } | undefined;
  if (mediaContent?.$?.url) return mediaContent.$.url;

  const html = String(item.content || item.contentSnippet || item.summary || "");
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

export function parseJsonStringArray(value: string | null | undefined, max = 8): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => sanitizeBriefingText(item, 90))
      .filter(Boolean)
      .slice(0, max);
  } catch {
    return [];
  }
}

export function normalizeScore(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Number(Math.min(1, Math.max(0, value)).toFixed(3));
}

export function sanitizeBriefingText(input: string | null | undefined, max = 180): string {
  const cleaned = normalizeWhitespace(stripHtml(input ?? ""))
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\butm_[a-z_]+=\S+/gi, "")
    .replace(/#?欢迎关注[^。！？\n]*(?:。|$)/g, "")
    .replace(/更多精彩内容[^。！？\n]*(?:。|$)/g, "")
    .replace(/\s*([,，。！？；:：])\s*/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();

  return truncate(cleaned, max);
}

export function normalizeBriefingTags(values: Array<string | null | undefined>, max = 6): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const value of values) {
    const normalized = sanitizeBriefingText(value, 14)
      .replace(/^#+/, "")
      .replace(/[｜|/\\()[\]{}"'`]/g, "")
      .trim();
    if (!normalized || normalized.length < 2) continue;
    if (/^(briefing|news|rss|api|json|tavily|source|来源|资讯)$/i.test(normalized)) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(normalized);
    if (tags.length >= max) break;
  }

  return tags;
}

function meaningfulLines(input: string): string[] {
  return normalizeWhitespace(input)
    .split(/\n|(?<=[。！？!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => {
      if (line.length < 12) return false;
      if (LOW_VALUE_LINE_RE.test(line)) return false;
      if (BOILERPLATE_RE.test(line)) return false;
      if (/^[{[\]},:"'\w\s.-]+$/.test(line) && !/[\u3400-\u9fff]/.test(line)) return false;
      return true;
    });
}

export function buildBriefingSummary(input: {
  title: string;
  aiSummary?: string | null;
  excerpt?: string | null;
  content?: string | null;
  max?: number;
}): string {
  const candidates = [input.aiSummary, input.excerpt, input.content]
    .map((value) => {
      const cleaned = sanitizeBriefingText(value, input.max ?? 180);
      const lines = meaningfulLines(cleaned).filter((line) => line !== input.title);
      return lines.length > 0 ? truncate(lines.join(" "), input.max ?? 180) : cleaned;
    })
    .filter((value) => value && value !== input.title && value.length >= 10);

  return candidates[0] ?? (input.title ? `这条资讯关注：${sanitizeBriefingText(input.title, Math.max(40, input.max ?? 180))}` : "");
}

export function buildBriefingKeyPoints(input: {
  title: string;
  aiSummary?: string | null;
  excerpt?: string | null;
  content?: string | null;
  max?: number;
}): string[] {
  const max = input.max ?? 4;
  const candidates = [input.aiSummary, input.excerpt, input.content]
    .map((value) => sanitizeBriefingText(value, 1200))
    .filter(Boolean);
  const seen = new Set<string>();
  const points: string[] = [];

  for (const candidate of candidates) {
    const lines = meaningfulLines(candidate).flatMap((line) =>
      line
        .split(/(?<=[。！？!?])\s+/)
        .map((part) => sanitizeBriefingText(part, 120))
        .filter((part) => part.length >= 12),
    );

    for (const line of lines) {
      if (line === input.title) continue;
      const key = line.slice(0, 42);
      if (seen.has(key)) continue;
      seen.add(key);
      points.push(line);
      if (points.length >= max) return points;
    }
  }

  return points;
}

export function buildBriefingDetailText(input: {
  title: string;
  summary?: string | null;
  excerpt?: string | null;
  content?: string | null;
  keyPoints?: string[];
  max?: number;
}): string {
  const max = input.max ?? 760;
  const candidates = [
    input.summary,
    ...(input.keyPoints ?? []),
    input.excerpt,
    input.content,
  ];

  const lines: string[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const cleaned = sanitizeBriefingText(candidate, max);
    for (const line of meaningfulLines(cleaned)) {
      if (line === input.title) continue;
      const key = line.slice(0, 64);
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(line);
      if (lines.join("\n").length >= max) break;
    }
    if (lines.join("\n").length >= max) break;
  }

  const detail = lines.join("\n");
  return truncate(detail || sanitizeBriefingText(input.summary || input.excerpt || "", max), max);
}

export function estimateReadingMinutes(input: string) {
  const text = sanitizeBriefingText(input, 2000);
  if (!text) return 1;
  const cjk = text.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  const latin = text.match(/[A-Za-z0-9]+/g)?.length ?? 0;
  return Math.max(1, Math.ceil((cjk + latin) / 420));
}

export function safeNumberArray(value: string | null | undefined): number[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is number => typeof item === "number" && Number.isFinite(item)).slice(-32);
  } catch {
    return [];
  }
}

export function parseBriefingDigestSummary(value: string | null | undefined): BriefingDigestSummary | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<BriefingDigestSummary>;
    if (!parsed || !Array.isArray(parsed.headlines)) return null;
    return {
      weekday: sanitizeBriefingText(parsed.weekday, 12),
      dateLabel: sanitizeBriefingText(parsed.dateLabel, 20),
      weather: parsed.weather ? sanitizeBriefingText(parsed.weather, 40) : undefined,
      headlines: parsed.headlines
        .filter((item): item is string => typeof item === "string")
        .map((item) => sanitizeBriefingText(item, 90))
        .filter(Boolean)
        .slice(0, 5),
    };
  } catch {
    return null;
  }
}
