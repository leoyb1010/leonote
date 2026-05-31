export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireCronToken } from "@/lib/cron-auth";
import { prisma } from "@/lib/prisma";
import { sendTelegramReminder } from "@/lib/reminders/telegram";

function formatReminderText(event: { title: string; startAt: Date }) {
  return `⏰ 提醒：${event.title}\n开始时间：${event.startAt.toLocaleString("zh-CN")}`;
}

async function resolveTelegramChatId(userId: string) {
  const token = await prisma.agentToken.findFirst({
    where: {
      userId,
      revoked: false,
      name: { contains: "telegram" },
    },
    orderBy: { createdAt: "desc" },
    select: { name: true },
  });

  const match = token?.name.match(/(?:tg|telegram)[:=]([\w-]+)/i);
  return match?.[1] ?? null;
}

export async function POST(request: Request) {
  const denied = requireCronToken(request, {
    envName: "REMINDER_CRON_TOKEN",
    headerName: "x-reminder-cron-token",
    missingMessage: "REMINDER_CRON_TOKEN 未配置",
  });
  if (denied) return denied;

  const run = await prisma.cronRun.create({ data: { task: "send-reminders", ok: false } });
  const now = new Date();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  try {
    const due = await prisma.scheduleEvent.findMany({
      where: {
        reminderSent: false,
        deletedAt: null,
        status: "planned",
        remindAt: { lte: now, not: null },
      },
      orderBy: { remindAt: "asc" },
      take: 100,
      select: { id: true, title: true, startAt: true, notifyChannel: true, userId: true },
    });

    for (const event of due) {
      if (event.notifyChannel !== "telegram") {
        skipped += 1;
        await prisma.scheduleEvent.update({ where: { id: event.id }, data: { reminderSent: true } });
        continue;
      }

      const chatId = await resolveTelegramChatId(event.userId);
      if (!chatId) {
        // No resolvable Telegram chat for this user — this is terminal, not
        // transient. Mark it sent so it leaves the (oldest-100) window;
        // otherwise these rows accumulate and starve all newer reminders.
        skipped += 1;
        await prisma.scheduleEvent.update({ where: { id: event.id }, data: { reminderSent: true } });
        continue;
      }

      try {
        await sendTelegramReminder(chatId, formatReminderText(event));
        await prisma.scheduleEvent.update({ where: { id: event.id }, data: { reminderSent: true } });
        sent += 1;
      } catch {
        failed += 1;
      }
    }

    const message = `due=${due.length}; sent=${sent}; skipped=${skipped}; failed=${failed}`;
    await prisma.cronRun.update({ where: { id: run.id }, data: { ok: failed === 0, endedAt: new Date(), message } });
    return NextResponse.json({ ok: failed === 0, due: due.length, sent, skipped, failed }, { status: failed === 0 ? 200 : 500 });
  } catch (error) {
    await prisma.cronRun.update({
      where: { id: run.id },
      data: { ok: false, endedAt: new Date(), message: error instanceof Error ? error.message : "unknown" },
    });
    return NextResponse.json({ ok: false, message: "send-reminders failed" }, { status: 500 });
  }
}
