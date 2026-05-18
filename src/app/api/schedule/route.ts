import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardUserWriteRequest } from "@/lib/request-guard";
import { getSessionUserId } from "@/lib/session";
import {
  listScheduleEvents,
  SCHEDULE_COLOR_OPTIONS,
  SCHEDULE_SOURCE_OPTIONS,
  SCHEDULE_STATUS_OPTIONS,
  toScheduleDTO,
} from "@/lib/schedule";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  allDay: z.boolean().default(false),
  status: z.enum(SCHEDULE_STATUS_OPTIONS).default("planned"),
  source: z.enum(SCHEDULE_SOURCE_OPTIONS).default("manual"),
  noteId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  gearItemId: z.string().nullable().optional(),
  color: z.enum(SCHEDULE_COLOR_OPTIONS).default("slate"),
});

function toDate(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

async function resolveOwnedReferences(userId: string, data: z.infer<typeof createSchema>) {
  const [note, project, gearItem] = await Promise.all([
    data.noteId ? prisma.note.findFirst({ where: { id: data.noteId, userId, deletedAt: null }, select: { id: true } }) : null,
    data.projectId ? prisma.project.findFirst({ where: { id: data.projectId, userId }, select: { id: true } }) : null,
    data.gearItemId ? prisma.gearItem.findFirst({ where: { id: data.gearItemId, userId, deletedAt: null }, select: { id: true } }) : null,
  ]);

  return {
    noteId: data.noteId && note ? data.noteId : null,
    projectId: data.projectId && project ? data.projectId : null,
    gearItemId: data.gearItemId && gearItem ? data.gearItemId : null,
  };
}

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status") || "all";
  const projectId = searchParams.get("projectId") || undefined;
  const events = await listScheduleEvents(userId, {
    from: from ? toDate(from) ?? undefined : undefined,
    to: to ? toDate(to) ?? undefined : undefined,
    status: SCHEDULE_STATUS_OPTIONS.includes(status as never) ? status as never : "all",
    projectId,
  });

  return NextResponse.json({ ok: true, events: events.map(toScheduleDTO) });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "schedule", { limit: 80 });
  if (guarded) return guarded;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "日程信息不完整" }, { status: 400 });

  const startAt = toDate(parsed.data.startAt);
  const endAt = toDate(parsed.data.endAt);
  if (!startAt || !endAt || endAt <= startAt) {
    return NextResponse.json({ ok: false, message: "结束时间需要晚于开始时间" }, { status: 400 });
  }

  const refs = await resolveOwnedReferences(userId, parsed.data);
  const event = await prisma.scheduleEvent.create({
    data: {
      userId,
      title: parsed.data.title,
      description: parsed.data.description ?? "",
      startAt,
      endAt,
      allDay: parsed.data.allDay,
      status: parsed.data.status,
      source: parsed.data.source,
      color: parsed.data.color,
      ...refs,
    },
    include: {
      note: { select: { id: true, title: true } },
      project: { select: { id: true, name: true, status: true } },
      gearItem: { select: { id: true, name: true, status: true, category: true } },
    },
  });

  return NextResponse.json({ ok: true, event: toScheduleDTO(event) });
}
