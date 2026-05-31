import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardUserWriteRequest } from "@/lib/request-guard";
import { getSessionUserId } from "@/lib/session";
import {
  requireOwnedScheduleEvent,
  SCHEDULE_COLOR_OPTIONS,
  SCHEDULE_SOURCE_OPTIONS,
  SCHEDULE_STATUS_OPTIONS,
  toScheduleDTO,
} from "@/lib/schedule";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  status: z.enum(SCHEDULE_STATUS_OPTIONS).optional(),
  source: z.enum(SCHEDULE_SOURCE_OPTIONS).optional(),
  noteId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  gearItemId: z.string().nullable().optional(),
  color: z.enum(SCHEDULE_COLOR_OPTIONS).optional(),
});

function toDate(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { id } = await context.params;
  const event = await requireOwnedScheduleEvent(id, userId);
  if (!event) return NextResponse.json({ ok: false, message: "日程不存在" }, { status: 404 });

  return NextResponse.json({ ok: true, event: toScheduleDTO(event) });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "schedule", { limit: 120 });
  if (guarded) return guarded;

  const { id } = await context.params;
  const current = await requireOwnedScheduleEvent(id, userId);
  if (!current) return NextResponse.json({ ok: false, message: "日程不存在" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "日程信息不完整" }, { status: 400 });

  const startAt = toDate(parsed.data.startAt) ?? current.startAt;
  const endAt = toDate(parsed.data.endAt) ?? current.endAt;
  if (endAt <= startAt) return NextResponse.json({ ok: false, message: "结束时间需要晚于开始时间" }, { status: 400 });

  const [note, project, gearItem] = await Promise.all([
    parsed.data.noteId ? prisma.note.findFirst({ where: { id: parsed.data.noteId, userId, deletedAt: null }, select: { id: true } }) : null,
    parsed.data.projectId ? prisma.project.findFirst({ where: { id: parsed.data.projectId, userId }, select: { id: true } }) : null,
    parsed.data.gearItemId ? prisma.gearItem.findFirst({ where: { id: parsed.data.gearItemId, userId, deletedAt: null }, select: { id: true } }) : null,
  ]);

  // When the event is rescheduled, the reminder must follow it. Without this,
  // a reminder fires at the stale time (or never, if already sent and the event
  // was moved into the future). Recompute remindAt from the offset and re-arm
  // reminderSent when the new reminder time is still in the future.
  const reminderUpdate: { remindAt?: Date; reminderSent?: boolean } = {};
  if (parsed.data.startAt !== undefined && current.remindOffset != null) {
    const newRemindAt = new Date(startAt.getTime() - current.remindOffset * 60000);
    reminderUpdate.remindAt = newRemindAt;
    if (newRemindAt.getTime() > Date.now()) {
      reminderUpdate.reminderSent = false;
    }
  }

  const updated = await prisma.scheduleEvent.update({
    where: { id: current.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      startAt,
      endAt,
      allDay: parsed.data.allDay,
      status: parsed.data.status,
      source: parsed.data.source,
      color: parsed.data.color,
      ...reminderUpdate,
      noteId: parsed.data.noteId === undefined ? undefined : parsed.data.noteId && note ? parsed.data.noteId : null,
      projectId: parsed.data.projectId === undefined ? undefined : parsed.data.projectId && project ? parsed.data.projectId : null,
      gearItemId: parsed.data.gearItemId === undefined ? undefined : parsed.data.gearItemId && gearItem ? parsed.data.gearItemId : null,
    },
    include: {
      note: { select: { id: true, title: true } },
      project: { select: { id: true, name: true, status: true } },
      gearItem: { select: { id: true, name: true, status: true, category: true } },
    },
  });

  return NextResponse.json({ ok: true, event: toScheduleDTO(updated) });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "schedule", { limit: 120 });
  if (guarded) return guarded;

  const { id } = await context.params;
  const current = await requireOwnedScheduleEvent(id, userId);
  if (!current) return NextResponse.json({ ok: false, message: "日程不存在" }, { status: 404 });

  await prisma.scheduleEvent.update({ where: { id: current.id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
