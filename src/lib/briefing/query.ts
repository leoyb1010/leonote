import { prisma } from "@/lib/prisma";
import { categoryLabel, deriveDisplayCategory, isDisplayableChinese, marketDisplayName, sourceDisplayName } from "./display";
import {
  buildBriefingKeyPoints,
  buildBriefingDetailText,
  buildBriefingSummary,
  estimateReadingMinutes,
  normalizeBriefingTags,
  normalizeScore,
  parseJsonStringArray,
  safeNumberArray,
  sanitizeBriefingText,
} from "./normalize";
import { needsTranslation } from "./translate";
import type { BriefingCategory, BriefingMetaDTO, BriefingRange, MarketSnapshotDTO, NewsItemDTO } from "./types";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function rangeWhere(range: BriefingRange, today: Date, weekStart: Date) {
  if (range === "today") {
    return {
      OR: [
        { publishedAt: { gte: today } },
        { fetchedAt: { gte: today } },
      ],
    };
  }

  if (range === "week") {
    return {
      OR: [
        { publishedAt: { gte: weekStart } },
        { fetchedAt: { gte: weekStart } },
      ],
    };
  }

  return {};
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
      ...rangeWhere(range, today, weekStart),
      ...(stateWhere ? { states: stateWhere } : {}),
    },
    include: {
      source: true,
      states: { where: { userId }, take: 1 },
    },
    orderBy: [{ aiScore: "desc" }, { publishedAt: "desc" }],
    take: category === "all" ? 500 : 240,
  });

  let candidateRows = rawItems;
  if (range === "today" && rawItems.length < 12) {
    const seen = new Set(rawItems.map((item) => item.id));
    const recentFallback = await prisma.newsItem.findMany({
      where: {
        OR: [
          { publishedAt: { gte: weekStart } },
          { fetchedAt: { gte: weekStart } },
        ],
      },
      include: {
        source: true,
        states: { where: { userId }, take: 1 },
      },
      orderBy: [{ aiScore: "desc" }, { fetchedAt: "desc" }, { publishedAt: "desc" }],
      take: 240,
    });
    candidateRows = [...rawItems, ...recentFallback.filter((item) => !seen.has(item.id))];
  }

  const displayableItems = candidateRows
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
      if (item.displayCategory === "social_x") {
        return !!item.aiSummary;
      }
      if (needsTranslation(item.title) && (!item.aiSummary || needsTranslation(item.aiSummary))) return false;
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
    const storedKeyPoints = parseJsonStringArray(item.aiKeyPoints, 5);
    const score = normalizeScore(item.aiScore);
    const rawTitle = sanitizeBriefingText(item.title, 96);
    const summary = buildBriefingSummary({
      title: rawTitle,
      aiSummary: item.aiSummary,
      excerpt: item.excerpt,
      content: item.content,
      max: 220,
    });
    const displayTitle = (item.displayCategory === "social_x" || needsTranslation(rawTitle)) && summary
      ? sanitizeBriefingText(summary, 82)
      : rawTitle;
    const normalizedSummary = displayTitle === summary
      ? buildBriefingSummary({ title: displayTitle, aiSummary: null, excerpt: item.excerpt, content: item.content, max: 170 })
      : summary;
    const generatedKeyPoints = buildBriefingKeyPoints({
      title: displayTitle,
      aiSummary: normalizedSummary,
      excerpt: item.excerpt,
      content: item.content,
      max: 4,
    });
    const keyPoints = generatedKeyPoints.length > 0
      ? generatedKeyPoints
      : storedKeyPoints.filter((point) => point !== rawTitle && point !== displayTitle);
    const tags = normalizeBriefingTags([
      ...parseJsonStringArray(item.aiTags, 8),
      categoryLabel(item.displayCategory),
    ]);
    const detailText = buildBriefingDetailText({
      title: displayTitle,
      summary: normalizedSummary,
      excerpt: item.excerpt,
      content: item.content,
      keyPoints,
      max: 1400,
    });

    return {
      id: item.id,
      title: displayTitle,
      url: item.url,
      imageUrl: item.imageUrl,
      excerpt: sanitizeBriefingText(item.excerpt, 180),
      category: item.displayCategory,
      sourceName: sourceDisplayName(item.source.name, item.displayCategory),
      publishedAt: item.publishedAt.toISOString(),
      aiSummary: normalizedSummary || null,
      aiKeyPoints: keyPoints,
      aiTags: tags,
      detailText,
      aiScore: score,
      readingMinutes: estimateReadingMinutes(detailText || normalizedSummary || item.excerpt),
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
      points: safeNumberArray(row.pointsJson),
      capturedAt: row.capturedAt.toISOString(),
    });
  }

  return latest;
}

export async function getBriefingMeta(): Promise<BriefingMetaDTO> {
  const [sourceCount, latestSource, latestDigest, cron] = await Promise.all([
    prisma.newsSource.count({ where: { enabled: true } }),
    prisma.newsSource.findFirst({
      where: { enabled: true, lastFetchAt: { not: null } },
      orderBy: { lastFetchAt: "desc" },
      select: { lastFetchAt: true },
    }),
    prisma.briefingDigest.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true, createdAt: true },
    }),
    prisma.cronRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 4,
      select: {
        task: true,
        ok: true,
        message: true,
        startedAt: true,
        endedAt: true,
      },
    }),
  ]);

  return {
    generatedAt: (latestDigest?.updatedAt ?? latestDigest?.createdAt ?? null)?.toISOString() ?? null,
    latestNewsFetchAt: latestSource?.lastFetchAt?.toISOString() ?? null,
    sourceCount,
    cron: cron.map((item) => ({
      task: item.task,
      ok: item.ok,
      message: sanitizeBriefingText(item.message, 80),
      startedAt: item.startedAt.toISOString(),
      endedAt: item.endedAt?.toISOString() ?? null,
    })),
  };
}
