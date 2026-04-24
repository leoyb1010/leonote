import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { readSessionValue, SESSION_COOKIE } from "@/lib/auth";
import { listNotes, toNoteDTO } from "@/lib/server-notes";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const cookieStore = await cookies();
  const session = readSessionValue(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session?.userId) return null;
  return session.userId;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const notes = await listNotes(userId, { status: "all" });
  const tags = await prisma.tag.findMany({ where: { userId }, orderBy: { name: "asc" } });
  const exportedAt = new Date();
  const filename = `leonote-export-${exportedAt.toISOString().slice(0, 10)}.json`;
  const body = JSON.stringify({ exportedAt: exportedAt.toISOString(), notes: notes.map(toNoteDTO), tags: tags.map((t) => t.name) }, null, 2);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
    },
  });
}
