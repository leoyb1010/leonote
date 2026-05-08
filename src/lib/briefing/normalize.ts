import crypto from "node:crypto";

export function stableExternalId(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);
}

export function stripHtml(input = "") {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(input: string, max = 180) {
  if (input.length <= max) return input;
  return `${input.slice(0, max).trim()}…`;
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
