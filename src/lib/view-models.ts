import { listNotes, toNoteDTO } from "@/lib/server-notes";
import { prisma } from "@/lib/prisma";
import { getExpenseSummary } from "@/lib/expense";

export async function getHomeViewData(userId: string) {
  const notes = (await listNotes(userId, { status: "active" })).map(toNoteDTO);
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }],
    take: 3,
    include: { _count: { select: { notes: true } } },
  });

  // v1.4: Memory flashback — find a note from ~21 days ago
  const twentyOneDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 21);
  const flashbackWindowStart = new Date(twentyOneDaysAgo.getTime() - 1000 * 60 * 60 * 24 * 3);
  const flashbackWindowEnd = new Date(twentyOneDaysAgo.getTime() + 1000 * 60 * 60 * 24 * 3);
  const memoryFlashback = await prisma.note.findFirst({
    where: {
      userId,
      deletedAt: null,
      isArchived: false,
      updatedAt: { gte: flashbackWindowStart, lte: flashbackWindowEnd },
    },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, excerpt: true, updatedAt: true },
  });

  // v1.4: Weekly settling stats
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const [weeklyCreated, weeklyEdited, weeklyReviewed, weeklyMemories] = await Promise.all([
    prisma.note.count({
      where: { userId, deletedAt: null, isArchived: false, createdAt: { gte: weekStart } },
    }),
    prisma.note.count({
      where: { userId, deletedAt: null, isArchived: false, updatedAt: { gte: weekStart } },
    }),
    prisma.note.count({
      where: { userId, deletedAt: null, lastViewedAt: { gte: weekStart } },
    }),
    prisma.memoryFact.count({
      where: { userId, createdAt: { gte: weekStart } },
    }),
  ]);

  // v1.4: Recently viewed notes
  const recentlyViewed = await prisma.note.findMany({
    where: { userId, deletedAt: null, isArchived: false, lastViewedAt: { not: null } },
    orderBy: { lastViewedAt: "desc" },
    take: 3,
    select: { id: true, title: true, excerpt: true, lastViewedAt: true },
  });

  // v1.5: Expense summary for home page
  const expenseSummary = await getExpenseSummary(userId);

  return {
    notes,
    recent: notes.slice(0, 5).map((note) => ({
      id: note.id,
      title: note.title,
      excerpt: note.excerpt,
      tags: note.tags,
      updatedAt: note.updatedAt.toISOString(),
    })),
    tags: Array.from(new Set(notes.flatMap((note) => note.tags))).slice(0, 8),
    counts: {
      favorite: notes.filter((n) => n.favorite).length,
      pinned: notes.filter((n) => n.pinned).length,
      total: notes.length,
    },
    projects: projects.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      noteCount: item._count.notes,
      updatedAt: item.updatedAt.toISOString(),
    })),
    // v1.4 additions
    memoryFlashback: memoryFlashback
      ? {
          id: memoryFlashback.id,
          title: memoryFlashback.title,
          excerpt: memoryFlashback.excerpt,
          updatedAt: memoryFlashback.updatedAt.toISOString(),
        }
      : null,
    weeklySettling: {
      created: weeklyCreated,
      edited: weeklyEdited,
      reviewed: weeklyReviewed,
      memories: weeklyMemories,
    },
    recentlyViewed: recentlyViewed.map((n) => ({
      id: n.id,
      title: n.title,
      excerpt: n.excerpt,
      lastViewedAt: n.lastViewedAt!.toISOString(),
    })),
    // v1.5 ledger
    weeklyExpense: {
      total: expenseSummary.weeklyTotal,
      monthTotal: expenseSummary.totalAmount,
      topCategories: expenseSummary.byCategory.slice(0, 2),
    },
  };
}

export async function getProjectCards(userId: string) {
  const projects = await prisma.project.findMany({
    where: { userId },
    include: {
      _count: { select: { notes: true } },
      notes: {
        where: { deletedAt: null },
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
        take: 4,
        include: { project: true, tags: { include: { tag: true } } },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return projects.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    noteCount: item._count.notes,
    updatedAt: (item.notes[0]?.updatedAt ?? item.updatedAt).toISOString(),
    status: item.status,
    previewNotes: item.notes.map((note) => ({
      id: note.id,
      title: note.title,
      excerpt: note.excerpt,
      tags: note.tags.map((tag) => tag.tag.name),
      favorite: note.isFavorite,
      pinned: note.isPinned,
      archived: note.isArchived,
      updatedAt: note.updatedAt.toISOString(),
    })),
  }));
}
