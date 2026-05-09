import { prisma } from "@/lib/prisma";
import { stableExternalId, stripHtml, truncate } from "../normalize";
import type { BriefingCategory } from "../types";

const TAVILY_API = "https://api.tavily.com/search";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
  images?: string[];
}

// Chinese-only queries — Tavily is a fallback, not primary
const CATEGORY_QUERIES: Record<BriefingCategory, string[]> = {
  world: ["今日国际要闻 全球重大新闻"],
  finance: ["今日全球金融市场 股市行情要闻"],
  ai_tech: ["今日人工智能AI 大模型 最新科技进展"],
  social_x: [],
};

async function searchTavily(query: string): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY not set");

  const res = await fetch(TAVILY_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      max_results: 10,
      include_domains: ["reuters.com", "bbc.com", "cnbc.com", "bloomberg.com", "wsj.com", "36kr.com", "jiqizhixin.com", "geekpark.net", "cls.cn", "yicai.com"],
      include_images: true,
    }),
  });

  if (!res.ok) throw new Error(`Tavily search failed: ${res.status}`);
  const json = await res.json();
  return (json.results ?? []) as TavilyResult[];
}

async function ensureTavilySources() {
  const sources: Array<{ id: string; name: string; category: BriefingCategory }> = [
    { id: "tavily-world", name: "聚合资讯 · 世界", category: "world" },
    { id: "tavily-finance", name: "聚合资讯 · 金融", category: "finance" },
    { id: "tavily-ai-tech", name: "聚合资讯 · 人工智能", category: "ai_tech" },
  ];

  for (const src of sources) {
    await prisma.newsSource.upsert({
      where: { id: src.id },
      create: {
        id: src.id,
        kind: "api",
        url: "https://tavily.com",
        name: src.name,
        category: src.category,
        region: "global",
        weight: 45, // Lower weight — RSS is primary
      },
      update: { name: src.name, category: src.category, weight: 45 },
    });
  }
}

export async function fetchTavilyNews() {
  await ensureTavilySources();

  const sourceMap = new Map<BriefingCategory, string>([
    ["world", "tavily-world"],
    ["finance", "tavily-finance"],
    ["ai_tech", "tavily-ai-tech"],
  ]);

  let totalInserted = 0;

  for (const [category, sourceId] of sourceMap) {
    // Only run Tavily if RSS hasn't provided enough items today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rssCount = await prisma.newsItem.count({
      where: {
        category,
        publishedAt: { gte: today },
        source: { kind: "rss" },
      },
    });

    // Skip Tavily if RSS already has 15+ items for this category today
    if (rssCount >= 15) {
      console.log(`[tavily] skipping ${category}: RSS already has ${rssCount} items today`);
      continue;
    }

    const queries = CATEGORY_QUERIES[category];
    const allResults: TavilyResult[] = [];
    const seenTitles = new Set<string>();

    for (const query of queries) {
      try {
        const results = await searchTavily(query);
        for (const r of results) {
          if (!seenTitles.has(r.title) && r.title && r.url) {
            seenTitles.add(r.title);
            allResults.push(r);
          }
        }
      } catch (err) {
        console.error(`[tavily] search failed for ${category}`, err instanceof Error ? err.message : "unknown");
      }
    }

    let inserted = 0;
    for (const r of allResults) {
      const externalId = stableExternalId(r.url);
      const publishedAt = r.published_date ? new Date(r.published_date) : new Date();
      const excerpt = truncate(stripHtml(r.content), 280);
      const imageUrl = r.images && r.images.length > 0 ? r.images[0] : null;

      await prisma.newsItem.upsert({
        where: { sourceId_externalId: { sourceId, externalId } },
        create: {
          sourceId,
          externalId,
          title: r.title,
          url: r.url,
          imageUrl,
          excerpt,
          content: r.content,
          publishedAt,
          category,
          region: "global",
          language: /[一-鿿]/.test(r.title) ? "zh" : "en",
        },
        update: {
          title: r.title,
          excerpt,
          content: r.content,
          imageUrl,
          publishedAt,
        },
      });

      inserted += 1;
    }

    await prisma.newsSource.update({
      where: { id: sourceId },
      data: { lastFetchAt: new Date(), failCount: 0 },
    });

    totalInserted += inserted;
  }

  return { sources: sourceMap.size, inserted: totalInserted };
}
