import Parser from "rss-parser";
import https from "node:https";
import http from "node:http";
import { HttpsProxyAgent } from "https-proxy-agent";
import { prisma } from "@/lib/prisma";
import { PRESET_NEWS_SOURCES } from "../sources";
import { deriveDisplayCategory } from "../display";
import { extractImageUrl, stableExternalId, stripHtml, truncate } from "../normalize";
import type { BriefingCategory } from "../types";

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "LeonoteBriefing/1.0 (+https://leonote.local)",
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
        headers: { "User-Agent": "LeonoteBriefing/1.0" },
        ...(proxyAgent ? { agent: proxyAgent } : {}),
      },
      (res) => {
        // Handle redirects — resolve relative locations against original URL
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const next = new URL(res.headers.location, feedUrl).toString();
          fetchFeedXml(next, redirectCount + 1).then(resolve, reject);
          return;
        }
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

async function ensurePresetSources() {
  for (const source of PRESET_NEWS_SOURCES) {
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
      },
      update: {
        kind: source.kind,
        name: source.name,
        category: source.category,
        region: source.region,
        weight: source.weight,
      },
    });
  }
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

      for (const item of feed.items.slice(0, 30)) {
        const url = item.link?.trim();
        const title = item.title?.trim();
        if (!url || !title) continue;

        const publishedAt = item.isoDate
          ? new Date(item.isoDate)
          : item.pubDate
            ? new Date(item.pubDate)
            : new Date();

        const rawExcerpt = item.contentSnippet || item.summary || item.content || "";
        const excerpt = truncate(stripHtml(rawExcerpt), 220);
        const externalId = item.guid || stableExternalId(url);
        const imageUrl = extractImageUrl(item as Record<string, unknown>);
        const category = inferCategory(source.category as BriefingCategory, source.name, title, excerpt);
        const language = /[一-鿿]/.test(title + excerpt) ? "zh" : "en";

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
            author: item.creator || item.author || null,
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
          enabled: source.failCount + 1 >= 5 ? false : source.enabled,
        },
      });
    }
  }

  return results;
}
