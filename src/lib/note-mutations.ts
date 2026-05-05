import { prisma } from "@/lib/prisma";

type NoteUpdateData = {
  title?: string;
  content?: string;
  excerpt?: string;
  isFavorite?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  projectId?: string | null;
  tags?: string[];
};

type ExistingNote = {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  userId: string;
};

export async function updateNoteWithRevision(
  existing: ExistingNote,
  data: NoteUpdateData,
  reason: string = "save",
) {
  const titleChanged = data.title !== undefined && data.title !== existing.title;
  const contentChanged = data.content !== undefined && data.content !== existing.content;
  const excerptChanged = data.excerpt !== undefined && data.excerpt !== existing.excerpt;
  const shouldSnapshot = titleChanged || contentChanged || excerptChanged;

  return prisma.$transaction(async (tx) => {
    if (shouldSnapshot) {
      await tx.noteRevision.create({
        data: {
          noteId: existing.id,
          userId: existing.userId,
          title: existing.title,
          content: existing.content,
          excerpt: existing.excerpt,
          reason,
        },
      });
    }

    const updated = await tx.note.update({
      where: { id: existing.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
        ...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
        ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
        ...(data.isArchived !== undefined && { isArchived: data.isArchived }),
        ...(data.projectId !== undefined && { projectId: data.projectId }),
      },
      include: {
        project: true,
        tags: { include: { tag: true } },
      },
    });

    if (shouldSnapshot) {
      const oldRevisions = await tx.noteRevision.findMany({
        where: { noteId: existing.id },
        orderBy: { createdAt: "desc" },
        skip: 10,
        select: { id: true },
      });

      if (oldRevisions.length > 0) {
        await tx.noteRevision.deleteMany({
          where: { id: { in: oldRevisions.map((r) => r.id) } },
        });
      }
    }

    if (data.tags !== undefined) {
      await tx.noteTag.deleteMany({ where: { noteId: existing.id } });
      const names = [...new Set(data.tags.map((t) => t.trim()).filter(Boolean))];
      for (const name of names) {
        const tag = await tx.tag.upsert({
          where: { name_userId: { name, userId: existing.userId } },
          update: {},
          create: { name, userId: existing.userId },
        });
        await tx.noteTag.create({ data: { noteId: existing.id, tagId: tag.id } });
      }
    }

    return updated;
  });
}
