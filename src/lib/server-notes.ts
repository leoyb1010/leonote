import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { searchNoteIds } from "@/lib/search";
import { toAttachmentDTO } from "@/lib/attachments";

type DbClient = typeof prisma | Prisma.TransactionClient;

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

export async function syncNoteTags(noteId: string, userId: string, inputTags: string[] = [], db: DbClient = prisma) {
  const note = await db.note.findFirst({ where: { id: noteId, userId }, select: { id: true } });
  if (!note) throw new Error("note-not-owned");

  const names = normalizeTagNames(inputTags);
  await db.noteTag.deleteMany({ where: { noteId } });

  if (names.length === 0) return;

  // Parallel upsert all tags, then batch-link
  const tags = await Promise.all(
    names.map((name) =>
      db.tag.upsert({
        where: { name_userId: { name, userId } },
        update: {},
        create: { name, userId },
      }),
    ),
  );

  await db.noteTag.createMany({
    data: tags.map((tag) => ({ noteId, tagId: tag.id })),
  });
}

export async function ensureProject(userId: string, name?: string, db: DbClient = prisma) {
  if (!name?.trim()) return null;
  const cleanName = name.trim();
  const baseSlug = slugifyProjectName(cleanName);

  // Check if project with same name already exists
  const existing = await db.project.findFirst({ where: { userId, name: cleanName } });
  if (existing) return existing;

  // Try creating with base slug; on unique constraint collision, append suffix and retry
  let slug = baseSlug;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      return await db.project.create({ data: { name: cleanName, slug, userId } });
    } catch (err: unknown) {
      const isUniqueViolation =
        err instanceof Error && /Unique.*slug_userId|constraint.*slug_userId/i.test(err.message);
      if (!isUniqueViolation) throw err;
      slug = `${baseSlug}-${attempt + 1}`;
    }
  }

  throw new Error("ensureProject: slug collision after 10 attempts");
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
  attachments?: {
    id: string;
    noteId: string;
    filename: string;
    mimeType: string;
    size: number;
    createdAt: Date;
  }[];
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
    attachments: note.attachments?.map(toAttachmentDTO) ?? [],
  };
}

export async function listNotes(userId: string, options?: { status?: string; q?: string; tag?: string; projectId?: string; take?: number | null }) {
  const status = options?.status ?? "active";
  const rawQ = options?.q?.trim();
  const q = rawQ && rawQ.length >= 2 ? rawQ : undefined;
  const tag = options?.tag?.trim();
  const projectId = options?.projectId?.trim();
  const take = options?.take === null ? undefined : options?.take === undefined ? 100 : Math.min(Math.max(options.take, 1), 500);

  // Try FTS5 search first for Chinese-friendly token matching
  let ftsIds: string[] | undefined;
  if (q) {
    ftsIds = await searchNoteIds(userId, q, take || 100);
  }

  return prisma.note.findMany({
    where: {
      userId,
      ...(ftsIds ? { id: { in: ftsIds } } : {}),
      projectId: projectId || undefined,
      deletedAt: status === "trash" ? { not: null } : status === "all" ? undefined : null,
      isArchived: status === "archived" ? true : status === "active" ? false : undefined,
      tags: tag ? { some: { tag: { name: tag } } } : undefined,
      OR: q && !ftsIds
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
      attachments: { orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    take,
  });
}

export async function requireOwnedNote(id: string, userId: string) {
  return prisma.note.findFirst({
    where: { id, userId, deletedAt: null },
    include: {
      project: true,
      tags: { include: { tag: true } },
      attachments: { orderBy: { createdAt: "asc" } },
    },
  });
}
