import { prisma } from "@/lib/prisma";
import { categoryLabel, deriveDisplayCategory, sourceDisplayName } from "./display";
import { buildBriefingSummary, parseBriefingDigestSummary, parseJsonStringArray, sanitizeBriefingText } from "./normalize";
import type { BriefingCategory } from "./types";

function formatDateTime(input: Date) {
  return input.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function importNewsItemToNote(userId: string, itemId: string) {
  const item = await prisma.newsItem.findUnique({
    where: { id: itemId },
    include: { source: true },
  });

  if (!item) throw new Error("news-item-not-found");

  const displayCategory = deriveDisplayCategory({
    category: item.category,
    sourceName: item.source.name,
    title: item.title,
    excerpt: item.excerpt,
  });
  const keyPoints = parseJsonStringArray(item.aiKeyPoints, 5);
  const label = categoryLabel(displayCategory);
  const sourceName = sourceDisplayName(item.source.name, displayCategory);
  const title = sanitizeBriefingText(item.title, 96);
  const summary = buildBriefingSummary({
    title,
    aiSummary: item.aiSummary,
    excerpt: item.excerpt,
    max: 220,
  });
  const tags = parseJsonStringArray(item.aiTags, 6);

  const content = [
    `# ${title}`,
    "",
    summary ? `> 智能摘要：${summary}` : "",
    "",
    keyPoints.length > 0 ? "**要点**" : "",
    ...keyPoints.map((point) => `- ${point}`),
    "",
    `**来源**：[${sourceName}](${item.url})  `,
    `**分类**：${label}  `,
    `**发布**：${formatDateTime(item.publishedAt)}  `,
    `**导入**：${formatDateTime(new Date())}`,
    "",
    `#简报 #${label}${tags.length > 0 ? ` ${tags.map((tag) => `#${tag}`).join(" ")}` : ""}`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  const note = await prisma.note.create({
    data: {
      title,
      content,
      excerpt: summary || "来自 Briefing 的资讯笔记",
      source: `briefing:${item.id}`,
      userId,
    },
  });

  await prisma.userBriefingState.upsert({
    where: { userId_itemId: { userId, itemId } },
    create: {
      userId,
      itemId,
      isRead: true,
      isImported: true,
      importedNoteId: note.id,
      readAt: new Date(),
    },
    update: {
      isRead: true,
      isImported: true,
      importedNoteId: note.id,
      readAt: new Date(),
    },
  });

  return note;
}

export async function importTodayDigestToNote(userId: string) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const digest = await prisma.briefingDigest.findFirst({
    where: { date: start },
  });

  const items = await prisma.newsItem.findMany({
    where: { publishedAt: { gte: start } },
    include: { source: true },
    orderBy: [{ aiScore: "desc" }, { publishedAt: "desc" }],
    take: 8,
  });

  const parsed = parseBriefingDigestSummary(digest?.summary);
  const sourceId = `briefing-digest:${start.toISOString().slice(0, 10)}`;

  const existing = await prisma.note.findFirst({
    where: { userId, source: sourceId },
  });
  if (existing) return existing;

  const title = `简报 · ${today.getMonth() + 1} 月 ${today.getDate()} 日`;

  const content = [
    `# ${title}`,
    "",
    "## 今天值得知道的三件事",
    ...(parsed?.headlines ?? []).map((line) => `- ${line}`),
    "",
    "## 值得继续阅读",
    ...items.map((item) => {
      const displayCategory = deriveDisplayCategory({
        category: item.category,
        sourceName: item.source.name,
        title: item.title,
        excerpt: item.excerpt,
      });
      const label = categoryLabel(displayCategory as BriefingCategory);
      const sourceName = sourceDisplayName(item.source.name, displayCategory);
      return `- [${sanitizeBriefingText(item.title, 96)}](${item.url}) · ${sourceName} · ${label}`;
    }),
    "",
    `导入时间：${formatDateTime(new Date())}`,
    "",
    "#简报 #今日简报",
  ].join("\n");

  return prisma.note.create({
    data: {
      title,
      content,
      excerpt: "来自 Briefing 的今日简报",
      source: `briefing-digest:${start.toISOString().slice(0, 10)}`,
      userId,
    },
  });
}
