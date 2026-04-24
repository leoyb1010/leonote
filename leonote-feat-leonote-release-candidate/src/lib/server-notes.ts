import { prisma } from "@/lib/prisma";

export function normalizeTagNames(input: string[] = []) {
  return [...new Set(input.map((item) => item.trim()).filter(Boolean))];
}

export function slugifyProjectName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "") || "project";
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

    await prisma.noteTag.create({ data: { noteId, tagId: tag.id } });
  }
}

export async function ensureProject(userId: string, name?: string) {
  if (!name?.trim()) return null;
  const cleanName = name.trim();
  const baseSlug = slugifyProjectName(cleanName);
  let slug = baseSlug;
  let count = 1;

  while (await prisma.project.findUnique({ where: { slug_userId: { slug, userId } } })) {
    const existing = await prisma.project.findFirst({ where: { userId, name: cleanName } });
    if (existing) return existing;
    count += 1;
    slug = `${baseSlug}-${count}`;
  }

  return prisma.project.create({
    data: { name: cleanName, slug, userId },
  });
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
  projectId?: string | null;
  project?: { id: string; name: string; slug: string } | null;
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
    projectId: note.projectId ?? null,
    project: note.project ? { id: note.project.id, name: note.project.name, slug: note.project.slug } : null,
    tags: note.tags.map((item) => item.tag.name),
  };
}

export async function listNotes(userId: string, options?: { status?: string; q?: string; tag?: string; projectId?: string }) {
  const status = options?.status ?? "active";
  const q = options?.q?.trim();
  const tag = options?.tag?.trim();
  const projectId = options?.projectId?.trim();

  return prisma.note.findMany({
    where: {
      userId,
      projectId: projectId || undefined,
      deletedAt: status === "trash" ? { not: null } : status === "all" ? undefined : null,
      isArchived: status === "archived" ? true : status === "active" ? false : undefined,
      tags: tag ? { some: { tag: { name: tag } } } : undefined,
      OR: q
        ? [
            { title: { contains: q } },
            { content: { contains: q } },
            { excerpt: { contains: q } },
            { project: { name: { contains: q } } },
            { tags: { some: { tag: { name: { contains: q } } } } },
          ]
        : undefined,
    },
    include: {
      project: true,
      tags: { include: { tag: true } },
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });
}

export async function requireOwnedNote(id: string, userId: string) {
  return prisma.note.findFirst({
    where: { id, userId },
    include: {
      project: true,
      tags: { include: { tag: true } },
    },
  });
}
