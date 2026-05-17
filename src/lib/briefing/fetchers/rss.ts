import Parser from "rss-parser";
import https from "node:https";
import http from "node:http";
import { HttpsProxyAgent } from "https-proxy-agent";
import { prisma } from "@/lib/prisma";
import { PRESET_NEWS_SOURCES } from "../sources";
import { deriveDisplayCategory, isLowValueCommunityItem } from "../display";
import { extractImageUrl, stableExternalId, stripHtml, truncate } from "../normalize";
import type { BriefingCategory } from "../types";

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
const MAX_FEED_BYTES = 3 * 1024 * 1024;

const parser = new Parser({
  timeout: 15000,
  headers: {
    "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    "User-Agent": "Mozilla/5.0 (compatible; LeonoteBriefing/1.0; +https://leonote.local)",
  },
});

function inferCategory(defaultCategory: BriefingCategory, sourceName: string, title: string, excerpt: string): BriefingCategory {
  return deriveDisplayCategory({ category: defaultCategory, sourceName, title, excerpt });
}

function fetchFeedXml(feedUrl: string, redirectCount = 0): Promise<string> {
  if (redirectCount > 5) return Promise.reject(new Error("too many redirects"));

  return new Promise((resolve, reject) => {
    const mod = feedUrl.startsWith("https:") ? https : http;
    const req = mod.get(
      feedUrl,
      {
        headers: {
          "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
          "User-Agent": "Mozilla/5.0 (compatible; LeonoteBriefing/1.0; +https://leonote.local)",
        },
        ...(proxyAgent ? { agent: proxyAgent } : {}),
      },
      (res) => {
        // Handle redirects — resolve relative locations against original URL
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = new URL(res.headers.location, feedUrl).toString();
          res.resume();
          fetchFeedXml(next, redirectCount + 1).then(resolve, reject);
          return;
        }
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const contentLength = Number(res.headers["content-length"] ?? "0");
        if (Number.isFinite(contentLength) && contentLength > MAX_FEED_BYTES) {
          res.resume();
          reject(new Error("feed too large"));
          return;
        }
        const chunks: Buffer[] = [];
        let received = 0;
        res.on("data", (chunk) => {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          received += buffer.length;
          if (received > MAX_FEED_BYTES) {
            req.destroy(new Error("feed too large"));
            return;
          }
          chunks.push(buffer);
        });
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

async function ensurePresetSources() {
  for (const source of PRESET_NEWS_SOURCES) {
    const enabled = source.enabled ?? true;
    await prisma.newsSource.upsert({
      where: { id: stableExternalId(source.url) },
      create: {
        id: stableExternalId(source.url),
        kind: source.kind,
        url: source.url,
        name: source.name,
        category: source.category,
        region: source.region,
        weight: source.weight,
        enabled,
      },
      update: {
        kind: source.kind,
        url: source.url,
        name: source.name,
        category: source.category,
        region: source.region,
        weight: source.weight,
        enabled,
        failCount: 0,
      },
    });
  }
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function safePublishedAt(isoDate: unknown, pubDate: unknown) {
  const raw = stringField(isoDate) || stringField(pubDate);
  const date = raw ? new Date(raw) : new Date();
  return Number.isFinite(date.getTime()) ? date : new Date();
}

function itemText(item: Record<string, unknown>) {
  const encoded = stringField(item["content:encoded"]);
  const content = stringField(item.content);
  const summary = stringField(item.summary);
  const snippet = stringField(item.contentSnippet);
  const rawContent = encoded || content || summary || snippet;
  const rawExcerpt = snippet || summary || content || encoded;

  return {
    excerpt: truncate(stripHtml(rawExcerpt), 320),
    content: truncate(stripHtml(rawContent), 1800),
  };
}

function itemAuthor(item: Record<string, unknown>) {
  const creator = stringField(item.creator);
  const author = stringField(item.author);
  if (creator) return creator;
  if (author) return author;

  const authorRecord = item.author;
  if (authorRecord && typeof authorRecord === "object" && "name" in authorRecord) {
    const name = (authorRecord as { name?: unknown }).name;
    if (Array.isArray(name) && typeof name[0] === "string") return name[0];
    if (typeof name === "string") return name;
  }

  return null;
}

export async function fetchNewsSources() {
  await ensurePresetSources();

  const sources = await prisma.newsSource.findMany({
    where: { enabled: true, kind: "rss" },
    orderBy: [{ weight: "desc" }, { name: "asc" }],
  });

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const xml = await fetchFeedXml(source.url);
      const feed = await parser.parseString(xml);
      let inserted = 0;

      for (const item of feed.items.slice(0, 40)) {
        const url = item.link?.trim();
        const title = item.title?.trim();
        if (!url || !title) continue;

        const publishedAt = safePublishedAt(item.isoDate, item.pubDate);
        const { excerpt, content } = itemText(item as Record<string, unknown>);
        if (isLowValueCommunityItem({ sourceName: source.name, title, excerpt, detailText: content })) continue;
        const externalId = item.guid || stableExternalId(url);
        const imageUrl = extractImageUrl(item as Record<string, unknown>);
        const category = inferCategory(source.category as BriefingCategory, source.name, title, excerpt);
        const language = /[\u3400-\u9fff]/.test(title + excerpt + content) ? "zh" : "en";

        await prisma.newsItem.upsert({
          where: {
            sourceId_externalId: {
              sourceId: source.id,
              externalId,
            },
          },
          create: {
            sourceId: source.id,
            externalId,
            title,
            url,
            imageUrl,
            excerpt,
            content,
            author: itemAuthor(item as Record<string, unknown>),
            publishedAt,
            category,
            region: source.region,
            language,
          },
          update: {
            title,
            url,
            imageUrl,
            excerpt,
            content,
            author: itemAuthor(item as Record<string, unknown>),
            publishedAt,
            category,
            language,
          },
        });

        inserted += 1;
      }

      await prisma.newsSource.update({
        where: { id: source.id },
        data: { lastFetchAt: new Date(), failCount: 0 },
      });

      return { source: source.name, inserted };
    }),
  );

  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    if (result.status === "rejected") {
      const source = sources[index];
      await prisma.newsSource.update({
        where: { id: source.id },
        data: {
          failCount: { increment: 1 },
        },
      });
    }
  }

  return results;
}
