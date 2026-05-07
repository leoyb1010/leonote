import { prisma } from "@/lib/prisma";

const STOP_WORDS = new Set([
  "这个",
  "那个",
  "什么",
  "怎么",
  "如何",
  "一下",
  "帮我",
  "总结",
  "笔记",
  "内容",
  "最近",
  "关于",
]);

export type GlobalContextNote = {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string;
};

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function extractSearchTerms(question: string) {
  const normalized = question
    .trim()
    .replace(/[，。！？、；：,.!?;:()[\]{}"'“”‘’]/g, " ")
    .replace(/\s+/g, " ");

  const segmented: string[] = [];
  try {
    const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });
    for (const part of segmenter.segment(normalized)) {
      if (part.isWordLike) segmented.push(part.segment);
    }
  } catch {
    segmented.push(...normalized.split(" "));
  }

  const terms = unique(
    segmented
      .concat(normalized.split(" "))
      .map((item) => item.trim())
      .filter((item) => item.length >= 2 && !STOP_WORDS.has(item)),
  );

  return terms.slice(0, 8);
}

function hasRecentIntent(question: string) {
  return /最近|本周|这周|一周|这几天|今天|昨天|近期/.test(question);
}

function hasBrowseAllIntent(question: string) {
  return /全部|所有|每一篇|全览|总体|整体|全局|总结|汇总|概况|梳理|回顾/.test(question);
}

function trimForContext(content: string, max = 3000) {
  const clean = content.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}...` : clean;
}

function noteBlock(note: {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  updatedAt: Date;
}) {
  return [
    `=== USER_NOTE_BEGIN id=${note.id} updatedAt=${note.updatedAt.toISOString()} ===`,
    `标题：${note.title}`,
    note.excerpt ? `摘要：${note.excerpt}` : "",
    `内容：${trimForContext(note.content)}`,
    "=== USER_NOTE_END ===",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function buildGlobalContext(userId: string, question: string) {
  const terms = extractSearchTerms(question);
  const isBrowseAll = hasBrowseAllIntent(question);
  const isRecent = hasRecentIntent(question);

  const noteWhere =
    terms.length > 0 && !isBrowseAll
      ? {
          userId,
          deletedAt: null,
          isArchived: false,
          OR: terms.flatMap((term) => [
            { title: { contains: term } },
            { excerpt: { contains: term } },
            { content: { contains: term } },
            { project: { name: { contains: term } } },
            { tags: { some: { tag: { name: { contains: term } } } } },
          ]),
        }
      : {
          userId,
          deletedAt: null,
          isArchived: false,
        };

  const noteLimit = isBrowseAll ? 50 : 20;

  const [matchedNotes, recentNotes, memories] = await Promise.all([
    prisma.note.findMany({
      where: noteWhere,
      include: { project: true, tags: { include: { tag: true } } },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      take: noteLimit,
    }),
    isRecent || isBrowseAll
      ? prisma.note.findMany({
          where: { userId, deletedAt: null, isArchived: false },
          include: { project: true, tags: { include: { tag: true } } },
          orderBy: [{ updatedAt: "desc" }],
          take: 50,
        })
      : Promise.resolve([]),
    prisma.memoryFact.findMany({
      where: { userId, isActive: true },
      orderBy: [{ updatedAt: "desc" }],
      take: 12,
      select: { id: true, type: true, content: true, confidence: true },
    }),
  ]);

  const noteMap = new Map<string, (typeof matchedNotes)[number]>();
  for (const note of [...matchedNotes, ...recentNotes]) noteMap.set(note.id, note);
  const notes = [...noteMap.values()].slice(0, isBrowseAll ? 50 : 20);

  const promptContext = [
    "用户笔记上下文：",
    notes.length > 0 ? notes.map(noteBlock).join("\n\n") : "（没有检索到相关笔记）",
    "",
    "长期记忆：",
    memories.length > 0
      ? memories
          .map((item) => `- id=${item.id}; type=${item.type}; confidence=${item.confidence}; content=${item.content}`)
          .join("\n")
      : "（没有可用长期记忆）",
  ].join("\n");

  return {
    notesUsed: notes.map((note): GlobalContextNote => ({
      id: note.id,
      title: note.title,
      excerpt: note.excerpt,
      updatedAt: note.updatedAt.toISOString(),
    })),
    promptContext,
  };
}
