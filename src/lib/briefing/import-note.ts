import { prisma } from "@/lib/prisma";

function formatDateTime(input: Date) {
  return input.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeJsonArray(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export async function importNewsItemToNote(userId: string, itemId: string) {
  const item = await prisma.newsItem.findUnique({
    where: { id: itemId },
    include: { source: true },
  });

  if (!item) throw new Error("news-item-not-found");

  const keyPoints = safeJsonArray(item.aiKeyPoints);
  const categoryLabel = item.category === "world" ? "世界" : item.category === "finance" ? "金融" : "AI科技";

  const content = [
    `# ${item.title}`,
    "",
    item.aiSummary ? `> AI 摘要：${item.aiSummary}` : item.excerpt ? `> 摘要：${item.excerpt}` : "",
    "",
    item.imageUrl ? `![封面](${item.imageUrl})` : "",
    "",
    keyPoints.length > 0 ? "**要点**" : "",
    ...keyPoints.map((point) => `- ${point}`),
    "",
    `**来源**：[${item.source.name}](${item.url})  `,
    `**分类**：${categoryLabel}  `,
    `**发布**：${formatDateTime(item.publishedAt)}  `,
    `**导入**：${formatDateTime(new Date())}`,
    "",
    `#briefing #${item.category}`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  const note = await prisma.note.create({
    data: {
      title: item.title,
      content,
      excerpt: item.aiSummary || item.excerpt || "来自 Briefing 的资讯笔记",
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

  const parsed = digest ? JSON.parse(digest.summary) : null;
  const title = `📰 简报 · ${today.getMonth() + 1} 月 ${today.getDate()} 日`;

  const content = [
    `# ${title}`,
    "",
    "## 今天值得知道的三件事",
    ...(parsed?.headlines ?? []).map((line: string) => `- ${line}`),
    "",
    "## 值得继续阅读",
    ...items.map((item) => `- [${item.title}](${item.url}) · ${item.source.name}`),
    "",
    `导入时间：${formatDateTime(new Date())}`,
    "",
    "#briefing #daily-briefing",
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
