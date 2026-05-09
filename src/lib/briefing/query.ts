import { prisma } from "@/lib/prisma";
import { deriveDisplayCategory, isDisplayableChinese, marketDisplayName, sourceDisplayName } from "./display";
import type { BriefingCategory, BriefingRange, MarketSnapshotDTO, NewsItemDTO } from "./types";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseJsonArray(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function getBriefingData(userId: string, options?: { range?: BriefingRange; category?: BriefingCategory | "all" }) {
  const range = options?.range ?? "today";
  const category = options?.category ?? "all";
  const today = startOfToday();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 7);

  const stateWhere = range === "favorites" ? { some: { userId, isFavorited: true } } : undefined;

  const rawItems = await prisma.newsItem.findMany({
    where: {
      ...(range === "today" ? { publishedAt: { gte: today } } : {}),
      ...(range === "week" ? { publishedAt: { gte: weekStart } } : {}),
      ...(stateWhere ? { states: stateWhere } : {}),
    },
    include: {
      source: true,
      states: { where: { userId }, take: 1 },
    },
    orderBy: [{ aiScore: "desc" }, { publishedAt: "desc" }],
    take: category === "all" ? 500 : 240,
  });

  const displayableItems = rawItems
    .map((item) => ({
      ...item,
      displayCategory: deriveDisplayCategory({
        category: item.category,
        sourceName: item.source.name,
        title: item.title,
        excerpt: item.excerpt,
      }),
    }))
    .filter((item) => category === "all" || item.displayCategory === category)
    .filter((item) => {
      // 强制过滤掉任何仍然是英文的内容，确保首页只有简体中文
      if (needsTranslation(item.title)) return false;
      return isDisplayableChinese(item.title, item.excerpt, item.aiSummary, item.source.name);
    });
  const rssItems = displayableItems.filter((item) => item.source.kind !== "api");
  const apiFallbackItems = displayableItems.filter((item) => item.source.kind === "api");
  const sourceItems = rssItems.length >= 30 ? rssItems : [...rssItems, ...apiFallbackItems];
  const items = category === "all"
    ? (["ai_tech", "social_x", "finance", "world"] as const).flatMap((itemCategory) =>
        sourceItems.filter((item) => item.displayCategory === itemCategory).slice(0, 30),
      )
    : sourceItems.slice(0, 90);

  const dto: NewsItemDTO[] = items.map((item) => {
    const state = item.states[0];
    return {
      id: item.id,
      title: item.title,
      url: item.url,
      imageUrl: item.imageUrl,
      excerpt: item.excerpt,
      category: item.displayCategory,
      sourceName: sourceDisplayName(item.source.name, item.displayCategory),
      publishedAt: item.publishedAt.toISOString(),
      aiSummary: item.aiSummary,
      aiKeyPoints: parseJsonArray(item.aiKeyPoints),
      content: item.content,
      aiScore: item.aiScore,
      isRead: Boolean(state?.isRead),
      isFavorited: Boolean(state?.isFavorited),
      isImported: Boolean(state?.isImported),
      importedNoteId: state?.importedNoteId ?? null,
    };
  });

  return dto;
}

export async function getLatestMarketSnapshots() {
  const rows = await prisma.marketSnapshot.findMany({
    orderBy: { capturedAt: "desc" },
    take: 120,
  });

  const seen = new Set<string>();
  const latest: MarketSnapshotDTO[] = [];

  for (const row of rows) {
    if (seen.has(row.symbol)) continue;
    seen.add(row.symbol);
    latest.push({
      symbol: row.symbol,
      name: marketDisplayName(row),
      category: row.category,
      price: row.price,
      changePct: row.changePct,
      changeAbs: row.changeAbs,
      points: JSON.parse(row.pointsJson || "[]"),
      capturedAt: row.capturedAt.toISOString(),
    });
  }

  return latest;
}
