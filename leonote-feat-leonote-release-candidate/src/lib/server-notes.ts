import { prisma } from "@/lib/prisma";

export function normalizeTagNames(input: string[] = []) {
  return [...new Set(input.map((item) => item.trim()).filter(Boolean))];
}

export async function syncNoteTags(noteId: string, userId: string, inputTags: string[] = []) {
  const names = normalizeTagNames(inputTags);
  await prisma.noteTag.deleteMany({ where: { noteId } });

  for (const name of names) {
    const tag = await prisma.tag.upsert({
      where: { name_userId: { name, userId } },
      update: {},
      create: { name, userId },
    });

    await prisma.noteTag.create({
      data: { noteId, tagId: tag.id },
    });
  }
}

export function toNoteDTO(note: {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  isFavorite: boolean;
  isPinned: boolean;
  isArchived: boolean;
  deletedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
  tags: { tag: { name: string } }[];
}) {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    excerpt: note.excerpt,
    favorite: note.isFavorite,
    pinned: note.isPinned,
    archived: note.isArchived,
    deletedAt: note.deletedAt,
    updatedAt: note.updatedAt,
    createdAt: note.createdAt,
    tags: note.tags.map((item) => item.tag.name),
  };
}

export async function listNotes(userId: string, options?: { status?: string; q?: string; tag?: string }) {
  const status = options?.status ?? "active";
  const q = options?.q?.trim();
  const tag = options?.tag?.trim();

  return prisma.note.findMany({
    where: {
      userId,
      deletedAt: status === "trash" ? { not: null } : status === "all" ? undefined : null,
      isArchived: status === "archived" ? true : status === "active" ? false : undefined,
      tags: tag ? { some: { tag: { name: tag } } } : undefined,
      OR: q
        ? [
            { title: { contains: q } },
            { content: { contains: q } },
            { excerpt: { contains: q } },
            { tags: { some: { tag: { name: { contains: q } } } } },
          ]
        : undefined,
    },
    include: {
      tags: { include: { tag: true } },
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });
}

export async function requireOwnedNote(id: string, userId: string) {
  return prisma.note.findFirst({
    where: { id, userId },
    include: {
      tags: { include: { tag: true } },
    },
  });
}
