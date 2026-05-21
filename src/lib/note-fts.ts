import { prisma } from "@/lib/prisma";

let ensurePromise: Promise<void> | null = null;

async function createNoteFtsObjects() {
  await prisma.$executeRawUnsafe(`
    CREATE VIRTUAL TABLE IF NOT EXISTS NoteFts USING fts5(
      noteId UNINDEXED,
      userId UNINDEXED,
      title,
      content,
      excerpt,
      tokenize = 'trigram'
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER IF NOT EXISTS note_fts_insert AFTER INSERT ON Note BEGIN
      INSERT INTO NoteFts(noteId, userId, title, content, excerpt)
      VALUES (new.id, new.userId, new.title, new.content, new.excerpt);
    END
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER IF NOT EXISTS note_fts_update AFTER UPDATE OF title, content, excerpt ON Note BEGIN
      UPDATE NoteFts
      SET title = new.title, content = new.content, excerpt = new.excerpt
      WHERE noteId = new.id;
    END
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER IF NOT EXISTS note_fts_delete AFTER DELETE ON Note BEGIN
      DELETE FROM NoteFts WHERE noteId = old.id;
    END
  `);
  // Only backfill if FTS table is empty to avoid scanning the full Note table on
  // every server start. New notes are covered by the INSERT trigger above.
  const existingCount = await prisma.$queryRawUnsafe<Array<{ cnt: number }>>(
    `SELECT COUNT(*) as cnt FROM NoteFts`
  ).then((rows) => rows[0]?.cnt ?? 0);
  if (existingCount === 0) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO NoteFts(noteId, userId, title, content, excerpt)
      SELECT id, userId, title, content, excerpt FROM Note
    `);
  }
}

export async function ensureNoteFtsReady() {
  ensurePromise ??= createNoteFtsObjects().catch((error) => {
    ensurePromise = null;
    throw error;
  });
  return ensurePromise;
}
