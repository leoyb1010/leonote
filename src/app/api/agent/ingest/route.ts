import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { resolveAgentToken } from "@/lib/agent-auth";
import { buildNoteMarkdown, ingestRemoteAttachment } from "@/lib/agent-ingest";
import { parseJsonBody } from "@/lib/http";
import { ensureNoteFtsReady } from "@/lib/note-fts";
import { prisma } from "@/lib/prisma";
import { rejectUserWriteBurst } from "@/lib/request-guard";
import { assertSafePublicUrl } from "@/lib/safe-url";
import { ensureProject, syncNoteTags } from "@/lib/server-notes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DbClient = typeof prisma | Prisma.TransactionClient;

const linkSchema = z.object({
  url: z.string().url(),
  label: z.string().trim().max(200).optional(),
});

const attachmentSchema = z.object({
  type: z.string().trim().max(40).optional(),
  url: z.string().url(),
  filename: z.string().trim().max(240).optional(),
});

const noteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(2000).default(""),
  bodyMarkdown: z.string().max(80_000).default(""),
  tags: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  projectName: z.string().trim().max(120).optional(),
  projectId: z.string().nullable().optional(),
  links: z.array(linkSchema).max(20).default([]),
  attachments: z.array(attachmentSchema).max(10).default([]),
});

const eventSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).default(""),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }),
  remindOffsetMinutes: z.number().int().min(0).max(60 * 24 * 30).default(60),
  notifyChannel: z.enum(["telegram", "web"]).default("telegram"),
});

const ingestSchema = z.object({
  idempotencyKey: z.string().trim().min(1).max(200),
  source: z.string().trim().min(1).max(80).default("telegram"),
  intent: z.enum(["note", "note_with_event", "event"]),
  note: noteSchema.optional(),
  event: eventSchema.optional(),
}).superRefine((data, ctx) => {
  if ((data.intent === "note" || data.intent === "note_with_event") && !data.note) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["note"], message: "缺少笔记内容" });
  }
  if ((data.intent === "event" || data.intent === "note_with_event") && !data.event) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["event"], message: "缺少日程内容" });
  }
});

function needsNote(intent: z.infer<typeof ingestSchema>["intent"]) {
  return intent === "note" || intent === "note_with_event";
}

function needsEvent(intent: z.infer<typeof ingestSchema>["intent"]) {
  return intent === "event" || intent === "note_with_event";
}

function toDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function jsonFromLog(log: { resultNoteId: string | null; resultEventId: string | null }) {
  return NextResponse.json({
    ok: true,
    duplicate: true,
    noteId: log.resultNoteId,
    eventId: log.resultEventId,
  });
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

async function resolveProjectId(userId: string, data: z.infer<typeof noteSchema>, db: DbClient = prisma) {
  if (data.projectName?.trim()) {
    return (await ensureProject(userId, data.projectName, db))?.id ?? null;
  }
  if (!data.projectId) return null;
  const ownedProject = await db.project.findFirst({ where: { id: data.projectId, userId }, select: { id: true } });
  if (!ownedProject) throw new Error("project-not-owned");
  return ownedProject.id;
}

async function createIngestLogOrDuplicate(input: {
  userId: string;
  idempotencyKey: string;
  source: string;
  rawPayload: string;
  resultNoteId?: string | null;
  resultEventId?: string | null;
  status: "success" | "failed";
  message?: string;
}) {
  try {
    await prisma.ingestLog.create({
      data: {
        userId: input.userId,
        idempotencyKey: input.idempotencyKey,
        source: input.source,
        rawPayload: input.rawPayload,
        resultNoteId: input.resultNoteId ?? null,
        resultEventId: input.resultEventId ?? null,
        status: input.status,
        message: input.message ?? "",
      },
    });
    return null;
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    return prisma.ingestLog.findUnique({
      where: { userId_idempotencyKey: { userId: input.userId, idempotencyKey: input.idempotencyKey } },
      select: { resultNoteId: true, resultEventId: true },
    });
  }
}

export async function POST(request: Request) {
  const body = await parseJsonBody(request);
  if (!body.ok) return body.response;

  const parsed = ingestSchema.safeParse(body.data);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "参数不合法" }, { status: 400 });
  const data = parsed.data;

  const requiredScopes = [
    ...(needsNote(data.intent) ? ["note:write"] : []),
    ...(needsEvent(data.intent) ? ["schedule:write"] : []),
  ];
  const authd = await resolveAgentToken(request, requiredScopes);
  if (!authd.ok) return NextResponse.json({ ok: false, message: authd.message }, { status: authd.status });
  const userId = authd.userId;

  const limited = rejectUserWriteBurst(userId, "agent-ingest", 60);
  if (limited) return limited;

  const existing = await prisma.ingestLog.findUnique({
    where: { userId_idempotencyKey: { userId, idempotencyKey: data.idempotencyKey } },
    select: { resultNoteId: true, resultEventId: true },
  });
  if (existing) return jsonFromLog(existing);

  const rawPayload = JSON.stringify(body.data);
  const safeLinks = [] as Array<{ url: string; label?: string }>;
  const attachmentResults: Array<{ id: string; filename: string; ok: boolean; message?: string }> = [];
  let noteId: string | null = null;
  let eventId: string | null = null;
  let logMessage = "";

  try {
    if (needsEvent(data.intent) && data.event) {
      const startAt = toDate(data.event.startAt);
      const endAt = toDate(data.event.endAt);
      if (!startAt || !endAt || endAt <= startAt) {
        return NextResponse.json({ ok: false, message: "结束时间需要晚于开始时间" }, { status: 400 });
      }
    }

    if (needsNote(data.intent)) {
      await ensureNoteFtsReady();
    }

    if (data.note) {
      for (const link of data.note.links) {
        try {
          await assertSafePublicUrl(link.url);
          safeLinks.push(link);
        } catch {
          logMessage = logMessage ? `${logMessage}; skipped unsafe link` : "skipped unsafe link";
        }
      }
    }

    if (needsNote(data.intent) && data.note) {
      const created = await prisma.$transaction(async (tx) => {
        const projectId = await resolveProjectId(userId, data.note!, tx);
        const content = buildNoteMarkdown({
          source: data.source,
          summary: data.note!.summary,
          bodyMarkdown: data.note!.bodyMarkdown,
          links: safeLinks,
        });
        const note = await tx.note.create({
          data: {
            title: data.note!.title,
            content,
            excerpt: data.note!.summary || content.slice(0, 120),
            source: `agent:${data.source}`,
            userId,
            projectId,
          },
        });
        await syncNoteTags(note.id, userId, data.note!.tags, tx);
        return note;
      });
      noteId = created.id;

      for (const attachment of data.note.attachments) {
        try {
          const saved = await ingestRemoteAttachment(userId, noteId, attachment);
          attachmentResults.push({ id: saved.id, filename: saved.filename, ok: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : "attachment-failed";
          attachmentResults.push({ id: "", filename: attachment.filename ?? attachment.url, ok: false, message });
        }
      }
    }

    if (needsEvent(data.intent) && data.event) {
      const startAt = toDate(data.event.startAt)!;
      const endAt = toDate(data.event.endAt)!;
      const remindAt = new Date(startAt.getTime() - data.event.remindOffsetMinutes * 60_000);
      const event = await prisma.scheduleEvent.create({
        data: {
          userId,
          title: data.event.title,
          description: data.event.description,
          startAt,
          endAt,
          allDay: false,
          status: "planned",
          source: "agent",
          color: "slate",
          noteId,
          remindAt,
          remindOffset: data.event.remindOffsetMinutes,
          reminderSent: false,
          notifyChannel: data.event.notifyChannel,
        },
      });
      eventId = event.id;
    }

    const duplicate = await createIngestLogOrDuplicate({
      userId,
      idempotencyKey: data.idempotencyKey,
      source: data.source,
      rawPayload,
      resultNoteId: noteId,
      resultEventId: eventId,
      status: "success",
      message: logMessage,
    });
    if (duplicate) return jsonFromLog(duplicate);

    return NextResponse.json({ ok: true, noteId, eventId, attachments: attachmentResults });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    const duplicate = await createIngestLogOrDuplicate({
      userId,
      idempotencyKey: data.idempotencyKey,
      source: data.source,
      rawPayload,
      resultNoteId: noteId,
      resultEventId: eventId,
      status: "failed",
      message,
    }).catch(() => null);
    if (duplicate) return jsonFromLog(duplicate);

    return NextResponse.json({ ok: false, message: "记录失败" }, { status: 500 });
  }
}
