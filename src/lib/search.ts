import { prisma } from "@/lib/prisma";

function escapeFtsQuery(q: string) {
  const cleaned = q.trim().replace(/["']/g, "");
  if (!cleaned) return "";
  return `"${cleaned.replace(/"/g, '""')}"`;
}

export async function searchNoteIds(userId: string, q: string, take = 100) {
  const query = escapeFtsQuery(q);
  if (!query) return [];

  try {
    const rows = await prisma.$queryRaw<Array<{ noteId: string }>>`
      SELECT f.noteId
      FROM NoteFts f
      JOIN Note n ON n.id = f.noteId
      WHERE f.userId = ${userId}
        AND NoteFts MATCH ${query}
        AND n.deletedAt IS NULL
        AND n.userId = ${userId}
      ORDER BY rank
      LIMIT ${take}
    `;
    return rows.map((row) => row.noteId);
  } catch {
    return [];
  }
}
