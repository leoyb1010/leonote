import { prisma } from "@/lib/prisma";
import { categoryLabel, deriveDisplayCategory, isDisplayableChinese } from "./display";
import { buildBriefingKeyPoints, buildBriefingSummary, normalizeBriefingTags, parseJsonStringArray, sanitizeBriefingText } from "./normalize";
import { needsTranslation, translateBatch } from "./translate";

function translationItemLimit() {
  const configured = Number(process.env.BRIEFING_TRANSLATE_ITEM_LIMIT || process.env.BRIEFING_TRANSLATE_MAX_ITEMS || 12);
  return Number.isFinite(configured) ? Math.max(0, configured) : 12;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function generateBriefingDigest() {
  const today = startOfToday();
  const todayWindow = {
    OR: [
      { publishedAt: { gte: today } },
      { fetchedAt: { gte: today } },
    ],
  };

  if (process.env.BRIEFING_TRANSLATE_ENGLISH !== "false") {
    const untranslated = await prisma.newsItem.findMany({
      where: {
        ...todayWindow,
      },
      orderBy: [{ fetchedAt: "desc" }],
      take: 240,
    });

    const toTranslate: Array<{ id: string; title: string; excerpt: string; content: string }> = [];
    const translateContent = process.env.BRIEFING_TRANSLATE_CONTENT === "true";
    for (const item of untranslated) {
      const needsTitle = needsTranslation(item.title);
      const needsExcerpt = needsTranslation(item.excerpt);
      const needsContent = item.content.length > item.excerpt.length + 80 && needsTranslation(item.content);
      if (needsTitle || needsExcerpt || needsContent) {
        toTranslate.push({
          id: item.id,
          title: item.title,
          excerpt: item.excerpt,
          content: translateContent && needsContent ? sanitizeBriefingText(item.content, 900) : "",
        });
      }
    }

    const selectedToTranslate = toTranslate.slice(0, translationItemLimit());
    if (selectedToTranslate.length > 0) {
      console.log(`[digest] translating ${selectedToTranslate.length}/${toTranslate.length} English items`);

      const titleTexts = selectedToTranslate.map((t) => t.title);
      const translatedTitles = await translateBatch(titleTexts);

      const excerptTexts = selectedToTranslate.map((t) => sanitizeBriefingText(t.excerpt || t.content, 700));
      const translatedExcerpts = await translateBatch(excerptTexts);
      const contentTexts = selectedToTranslate.map((t) => t.content).filter(Boolean);
      const translatedContents = contentTexts.length > 0 ? await translateBatch(contentTexts) : [];
      let contentIndex = 0;

      for (let i = 0; i < selectedToTranslate.length; i++) {
        const orig = selectedToTranslate[i];
        const newTitle = translatedTitles[i] ?? orig.title;
        const newExcerpt = translatedExcerpts[i] ?? orig.excerpt;
        const newContent = orig.content
          ? translatedContents[contentIndex++] ?? orig.content
          : "";
        const cleanSummary = buildBriefingSummary({
          title: newTitle,
          aiSummary: newExcerpt,
          excerpt: newExcerpt,
          content: newContent,
          max: 260,
        });
        const keyPoints = buildBriefingKeyPoints({
          title: newTitle,
          aiSummary: cleanSummary,
          excerpt: newExcerpt,
          content: newContent,
          max: 4,
        });
        const wasTranslated = newTitle !== orig.title || newExcerpt !== orig.excerpt || Boolean(newContent && newContent !== orig.content);
        await prisma.newsItem.update({
          where: { id: orig.id },
          data: {
            title: newTitle,
            excerpt: newExcerpt,
            ...(newContent ? { content: newContent } : {}),
            language: wasTranslated ? "zh" : undefined,
            aiSummary: cleanSummary || newExcerpt || null,
            aiKeyPoints: keyPoints.length > 0 ? JSON.stringify(keyPoints) : undefined,
          },
        });
      }
    }
  }

  const displayableItems = (await prisma.newsItem.findMany({
    where: todayWindow,
    include: { source: true },
    orderBy: [{ fetchedAt: "desc" }, { publishedAt: "desc" }],
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
    // 强制要求标题必须经过 AI 翻译/简体化处理
    if (needsTranslation(item.title)) continue;
    if (usedCategories.has(item.category) && sorted.length > 6) continue;
    usedCategories.add(item.category);
    topHeadlines.push(sanitizeBriefingText(item.title, 90));
  }

  const summary = {
    weekday,
    dateLabel,
    headlines: topHeadlines.length >= 3
      ? topHeadlines
      : items
          .filter((item) => !needsTranslation(item.title))
          .slice(0, 3)
          .map((item) => sanitizeBriefingText(item.title, 90)),
  };

  const digest = await prisma.briefingDigest.upsert({
    where: { date: today },
    create: { date: today, summary: JSON.stringify(summary) },
    update: { summary: JSON.stringify(summary) },
  });

  // Write scores
  for (const item of scoredItems) {
    const displayCategory = deriveDisplayCategory({
      category: item.category,
      sourceName: item.source.name,
      title: item.title,
      excerpt: item.excerpt,
    });
    const title = sanitizeBriefingText(item.title, 96);
    const cleanSummary = buildBriefingSummary({
      title,
      aiSummary: item.aiSummary,
      excerpt: item.excerpt,
      content: item.content,
      max: 240,
    });
    const existingKeyPoints = parseJsonStringArray(item.aiKeyPoints, 5);
    const generatedKeyPoints = buildBriefingKeyPoints({
      title,
      aiSummary: cleanSummary,
      excerpt: item.excerpt,
      content: item.content,
      max: 4,
    });
    const keyPoints = generatedKeyPoints.length > 0
      ? generatedKeyPoints
      : existingKeyPoints.filter((point) => point !== title);

    await prisma.newsItem.update({
      where: { id: item.id },
      data: {
        aiScore: item.score,
        aiSummary: cleanSummary || null,
        aiKeyPoints: keyPoints.length > 0 ? JSON.stringify(keyPoints) : JSON.stringify([cleanSummary || title]),
        aiTags: item.aiTags || JSON.stringify(normalizeBriefingTags([categoryLabel(displayCategory), item.source.name], 4)),
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
