import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SCHEDULE_STATUS_OPTIONS = ["planned", "done", "canceled"] as const;
export const SCHEDULE_SOURCE_OPTIONS = ["manual", "note", "project", "briefing", "gear"] as const;
export const SCHEDULE_COLOR_OPTIONS = ["slate", "violet", "blue", "emerald", "amber", "rose"] as const;

export type ScheduleStatus = (typeof SCHEDULE_STATUS_OPTIONS)[number];
export type ScheduleSource = (typeof SCHEDULE_SOURCE_OPTIONS)[number];
export type ScheduleColor = (typeof SCHEDULE_COLOR_OPTIONS)[number];

type ScheduleEventWithRelations = Prisma.ScheduleEventGetPayload<{
  include: {
    note: { select: { id: true; title: true } };
    project: { select: { id: true; name: true; status: true } };
    gearItem: { select: { id: true; name: true; status: true; category: true } };
  };
}>;

export function startOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function startOfWeek(date = new Date()) {
  const next = startOfDay(date);
  const day = next.getDay();
  next.setDate(next.getDate() - day);
  return next;
}

export function endOfWeek(date = new Date()) {
  const next = startOfWeek(date);
  next.setDate(next.getDate() + 7);
  next.setMilliseconds(-1);
  return next;
}

export function scheduleStatusLabel(status: string) {
  const labels: Record<ScheduleStatus, string> = {
    planned: "计划中",
    done: "已完成",
    canceled: "已取消",
  };
  return labels[SCHEDULE_STATUS_OPTIONS.includes(status as ScheduleStatus) ? status as ScheduleStatus : "planned"];
}

export function scheduleSourceLabel(source: string) {
  const labels: Record<ScheduleSource, string> = {
    manual: "手动",
    note: "笔记",
    project: "项目",
    briefing: "简报",
    gear: "装备",
  };
  return labels[SCHEDULE_SOURCE_OPTIONS.includes(source as ScheduleSource) ? source as ScheduleSource : "manual"];
}

export function toScheduleDTO(item: ScheduleEventWithRelations) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    startAt: item.startAt.toISOString(),
    endAt: item.endAt.toISOString(),
    allDay: item.allDay,
    status: item.status,
    statusLabel: scheduleStatusLabel(item.status),
    source: item.source,
    sourceLabel: scheduleSourceLabel(item.source),
    color: item.color,
    noteId: item.noteId,
    projectId: item.projectId,
    gearItemId: item.gearItemId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    note: item.note ? { id: item.note.id, title: item.note.title } : null,
    project: item.project ? { id: item.project.id, name: item.project.name, status: item.project.status } : null,
    gearItem: item.gearItem ? { id: item.gearItem.id, name: item.gearItem.name, status: item.gearItem.status, category: item.gearItem.category } : null,
  };
}

export async function listScheduleEvents(
  userId: string,
  options?: {
    from?: Date;
    to?: Date;
    status?: ScheduleStatus | "all";
    projectId?: string;
    take?: number;
  },
) {
  return prisma.scheduleEvent.findMany({
    where: {
      userId,
      deletedAt: null,
      status: options?.status && options.status !== "all" ? options.status : undefined,
      projectId: options?.projectId || undefined,
      startAt: options?.to ? { lte: options.to } : undefined,
      endAt: options?.from ? { gte: options.from } : undefined,
    },
    include: {
      note: { select: { id: true, title: true } },
      project: { select: { id: true, name: true, status: true } },
      gearItem: { select: { id: true, name: true, status: true, category: true } },
    },
    orderBy: [{ startAt: "asc" }],
    take: Math.min(Math.max(options?.take ?? 120, 1), 300),
  });
}

export async function requireOwnedScheduleEvent(id: string, userId: string) {
  return prisma.scheduleEvent.findFirst({
    where: { id, userId, deletedAt: null },
    include: {
      note: { select: { id: true, title: true } },
      project: { select: { id: true, name: true, status: true } },
      gearItem: { select: { id: true, name: true, status: true, category: true } },
    },
  });
}

export async function getScheduleSummary(userId: string, now = new Date()) {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const [today, week, overdue, next] = await Promise.all([
    prisma.scheduleEvent.count({
      where: { userId, deletedAt: null, status: "planned", startAt: { lte: todayEnd }, endAt: { gte: todayStart } },
    }),
    prisma.scheduleEvent.count({
      where: { userId, deletedAt: null, status: "planned", startAt: { lte: weekEnd }, endAt: { gte: weekStart } },
    }),
    prisma.scheduleEvent.count({
      where: { userId, deletedAt: null, status: "planned", endAt: { lt: now } },
    }),
    listScheduleEvents(userId, { from: now, to: weekEnd, status: "planned", take: 5 }),
  ]);

  return {
    today,
    week,
    overdue,
    next: next.map(toScheduleDTO),
  };
}

export async function getScheduleReferenceOptions(userId: string) {
  const [projects, notes, gearItems] = await Promise.all([
    prisma.project.findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }],
      take: 40,
      select: { id: true, name: true, status: true },
    }),
    prisma.note.findMany({
      where: { userId, deletedAt: null, isArchived: false },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      take: 40,
      select: { id: true, title: true },
    }),
    prisma.gearItem.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ updatedAt: "desc" }],
      take: 40,
      select: { id: true, name: true, status: true, category: true },
    }),
  ]);

  return { projects, notes, gearItems };
}
