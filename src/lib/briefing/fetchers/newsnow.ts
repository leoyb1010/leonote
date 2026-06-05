/**
 * NewsNow 国内热榜 fetcher（实验性）
 *
 * 通过 newsnow(https://github.com/ourongxing/newsnow, MIT)的 `/api/s?id=<source>` 接口拉取
 * 微博/知乎/百度等平台热榜，映射成 leonote 的 NewsItem。
 *
 * 默认关闭：需设置 BRIEFING_NEWSNOW_ENABLED=true 才会抓取。
 * 数据源：默认走公开实例 newsnow.busiyi.world（受 Cloudflare 保护，需带浏览器 UA；可能限流/封禁），
 * 可用 NEWSNOW_BASE_URL 指向自建实例以提升稳定性与合规可控性。
 */
import { prisma } from "@/lib/prisma";
import { assertSafePublicUrl } from "@/lib/safe-url";
import { stableExternalId, stripHtml, truncate } from "../normalize";
import type { BriefingCategory } from "../types";

const NEWSNOW_BASE_URL = (process.env.NEWSNOW_BASE_URL || "https://newsnow.busiyi.world").replace(/\/$/, "");
const NEWSNOW_ENABLED = process.env.BRIEFING_NEWSNOW_ENABLED === "true";
const FETCH_TIMEOUT_MS = 15_000;
const MAX_ITEMS_PER_SOURCE = 30;
// 公开实例由 Cloudflare 保护，纯 curl/无 UA 会被 challenge 拦截，需带常规浏览器 UA。
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

interface NewsNowSource {
  /** newsnow 的 source id，对应 /api/s?id= */
  id: string;
  name: string;
  category: BriefingCategory;
  region: "cn" | "global" | "us";
  weight: number;
}

// 精选源：仅纳入与 leonote 三个分类(world/finance/ai_tech)契合的热榜，避免娱乐/八卦噪音。
const NEWSNOW_SOURCES: NewsNowSource[] = [
  { id: "zhihu", name: "知乎热榜", category: "world", region: "cn", weight: 60 },
  { id: "weibo", name: "微博热搜", category: "world", region: "cn", weight: 58 },
  { id: "baidu", name: "百度热搜", category: "world", region: "cn", weight: 56 },
  { id: "thepaper", name: "澎湃新闻热榜", category: "world", region: "cn", weight: 62 },
  { id: "cls", name: "财联社电报", category: "finance", region: "cn", weight: 64 },
  { id: "wallstreetcn", name: "华尔街见闻", category: "finance", region: "cn", weight: 62 },
  { id: "jin10", name: "金十数据", category: "finance", region: "cn", weight: 58 },
  { id: "ithome", name: "IT之家", category: "ai_tech", region: "cn", weight: 56 },
  { id: "36kr", name: "36氪", category: "ai_tech", region: "cn", weight: 56 },
  { id: "juejin", name: "稀土掘金", category: "ai_tech", region: "cn", weight: 50 },
];

interface NewsNowItem {
  id?: string | number;
  title?: string;
  url?: string;
  extra?: { info?: string; hover?: string };
}

interface NewsNowResponse {
  status?: string;
  id?: string;
  items?: NewsNowItem[];
}

function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchSource(sourceId: string): Promise<NewsNowItem[]> {
  const endpoint = `${NEWSNOW_BASE_URL}/api/s?id=${encodeURIComponent(sourceId)}`;
  // Block SSRF in case NEWSNOW_BASE_URL is mis-set to an internal address.
  await assertSafePublicUrl(endpoint, { allowHttp: true });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as NewsNowResponse;
    return Array.isArray(data.items) ? data.items : [];
  } finally {
    clearTimeout(timer);
  }
}

async function ensureNewsNowSources() {
  for (const source of NEWSNOW_SOURCES) {
    const id = stableExternalId(`newsnow:${source.id}`);
    await prisma.newsSource.upsert({
      where: { id },
      create: {
        id,
        kind: "json",
        url: `${NEWSNOW_BASE_URL}/api/s?id=${source.id}`,
        name: source.name,
        category: source.category,
        region: source.region,
        weight: source.weight,
        enabled: true,
      },
      update: {
        kind: "json",
        name: source.name,
        category: source.category,
        region: source.region,
        weight: source.weight,
        failCount: 0,
      },
    });
  }
}

/**
 * 拉取 newsnow 热榜并写入 NewsItem。默认关闭(BRIEFING_NEWSNOW_ENABLED!=true 时直接返回)。
 * 单个源失败不影响其它源，整体失败不抛出(由调用方决定是否记录)。
 */
export async function fetchNewsNowSources(): Promise<{ enabled: boolean; inserted: number }> {
  if (!NEWSNOW_ENABLED) return { enabled: false, inserted: 0 };

  await ensureNewsNowSources();
  let inserted = 0;

  for (const source of NEWSNOW_SOURCES) {
    const sourceId = stableExternalId(`newsnow:${source.id}`);
    try {
      const items = await fetchSource(source.id);
      for (const item of items.slice(0, MAX_ITEMS_PER_SOURCE)) {
        const title = item.title?.trim();
        const url = item.url?.trim();
        // 没有标题或链接、或链接非 http(s)(防存储型 XSS)一律跳过。
        if (!title || !url || !isHttpUrl(url)) continue;

        const externalId = item.id ? stableExternalId(`newsnow:${source.id}:${item.id}`) : stableExternalId(url);
        const excerpt = truncate(stripHtml(item.extra?.hover || ""), 320);

        await prisma.newsItem.upsert({
          where: { sourceId_externalId: { sourceId, externalId } },
          create: {
            sourceId,
            externalId,
            title,
            url,
            excerpt,
            content: excerpt,
            publishedAt: new Date(),
            category: source.category,
            region: source.region,
            language: "zh",
          },
          update: {
            title,
            url,
            excerpt,
            category: source.category,
          },
        });
        inserted += 1;
      }
      await prisma.newsSource.update({ where: { id: sourceId }, data: { failCount: 0, lastFetchAt: new Date() } });
    } catch (error) {
      console.error(`[briefing] newsnow ${source.id} failed`, error instanceof Error ? error.message : "unknown");
      await prisma.newsSource
        .update({ where: { id: sourceId }, data: { failCount: { increment: 1 } } })
        .catch(() => {});
    }
  }

  return { enabled: true, inserted };
}
