import { listNotes, toNoteDTO } from "@/lib/server-notes";
import { prisma } from "@/lib/prisma";

export async function getHomeViewData(userId: string) {
  const notes = (await listNotes(userId, { status: "active" })).map(toNoteDTO);
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }],
    take: 3,
    include: { _count: { select: { notes: true } } },
  });

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
  };
}

export async function getProjectCards(userId: string) {
  const projects = await prisma.project.findMany({
    where: { userId },
    include: { _count: { select: { notes: true } }, notes: { orderBy: { updatedAt: "desc" }, take: 1, select: { updatedAt: true } } },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });

  return projects.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    noteCount: item._count.notes,
    updatedAt: (item.notes[0]?.updatedAt ?? item.updatedAt).toISOString(),
    status: item.status,
  }));
}
