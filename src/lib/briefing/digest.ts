import { prisma } from "@/lib/prisma";
import { hasChineseSignal, isDisplayableChinese } from "./display";
import { needsTranslation, translateBatch } from "./translate";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function generateBriefingDigest() {
  const today = startOfToday();

  if (process.env.BRIEFING_TRANSLATE_ENGLISH === "true") {
    const untranslated = await prisma.newsItem.findMany({
      where: {
        publishedAt: { gte: today },
        language: "en",
      },
      take: 100,
    });

    const toTranslate: Array<{ id: string; title: string; excerpt: string }> = [];
    for (const item of untranslated) {
      if (needsTranslation(item.title)) {
        toTranslate.push({ id: item.id, title: item.title, excerpt: item.excerpt });
      }
    }

    if (toTranslate.length > 0) {
      console.log(`[digest] translating ${toTranslate.length} English items`);

      const titleTexts = toTranslate.map((t) => t.title);
      const translatedTitles = await translateBatch(titleTexts);

      const excerptTexts = toTranslate.map((t) => t.excerpt);
      const translatedExcerpts = await translateBatch(excerptTexts);

      for (let i = 0; i < toTranslate.length; i++) {
        const orig = toTranslate[i];
        const newTitle = translatedTitles[i] ?? orig.title;
        const newExcerpt = translatedExcerpts[i] ?? orig.excerpt;
        const wasTranslated = newTitle !== orig.title || newExcerpt !== orig.excerpt;
        await prisma.newsItem.update({
          where: { id: orig.id },
          data: {
            title: newTitle,
            excerpt: newExcerpt,
            ...(wasTranslated ? { language: "zh", aiSummary: newExcerpt } : {}),
          },
        });
      }
    }
  }

  const displayableItems = (await prisma.newsItem.findMany({
    where: { publishedAt: { gte: today } },
    include: { source: true },
    orderBy: [{ publishedAt: "desc" }],
    take: 500,
  })).filter((item) => isDisplayableChinese(item.title, item.excerpt, item.aiSummary, item.source.name));
  const rssItems = displayableItems.filter((item) => item.source.kind !== "api");
  const items = rssItems.length >= 10 ? rssItems : displayableItems;

  const now = new Date();
  const weekday = now.toLocaleDateString("zh-CN", { weekday: "long" });
  const dateLabel = `${now.getMonth() + 1}月${now.getDate()}日`;

  // Clustering by title similarity for cross-source boost
  const clusters: Array<{ title: string; count: number; sources: Set<string> }> = [];
  for (const item of items) {
    let matched = false;
    for (const cluster of clusters) {
      if (titleSimilarity(item.title, cluster.title) > 0.3) {
        cluster.count += 1;
        cluster.sources.add(item.source.name);
        matched = true;
        break;
      }
    }
    if (!matched) {
      clusters.push({ title: item.title, count: 1, sources: new Set([item.source.name]) });
    }
  }

  const scoredItems = items.map((item) => {
    const ageHours = Math.max(0.1, (Date.now() - item.publishedAt.getTime()) / 3_600_000);
    const cluster = clusters.find((c) => titleSimilarity(item.title, c.title) > 0.3);
    const clusterBoost = cluster ? Math.min(1, cluster.count / 5) : 0;

    return {
      ...item,
      score: Number(
        (Math.max(0, 1 - ageHours / 48) * 0.35 +
          (item.source.weight / 100) * 0.25 +
          clusterBoost * 0.4).toFixed(3),
      ),
    };
  });

  // Top headlines from different categories
  const topHeadlines: string[] = [];
  const usedCategories = new Set<string>();
  const sorted = [...scoredItems].sort((a, b) => b.score - a.score);
  for (const item of sorted) {
    if (topHeadlines.length >= 3) break;
    if (!hasChineseSignal(item.title)) continue;
    if (usedCategories.has(item.category) && sorted.length > 6) continue;
    usedCategories.add(item.category);
    topHeadlines.push(item.title);
  }

  const summary = {
    weekday,
    dateLabel,
    headlines: topHeadlines.length >= 3 ? topHeadlines : items.filter((item) => hasChineseSignal(item.title)).slice(0, 3).map((i) => i.title),
  };

  const digest = await prisma.briefingDigest.upsert({
    where: { date: today },
    create: { date: today, summary: JSON.stringify(summary) },
    update: { summary: JSON.stringify(summary) },
  });

  // Write scores
  for (const item of scoredItems) {
    await prisma.newsItem.update({
      where: { id: item.id },
      data: {
        aiScore: item.score,
        aiSummary: item.aiSummary || item.excerpt || null,
        aiKeyPoints: item.aiKeyPoints || JSON.stringify([item.title]),
      },
    });
  }

  return digest;
}

function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 1));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 1));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) intersection += 1;
  }
  return intersection / Math.max(wordsA.size, wordsB.size);
}
