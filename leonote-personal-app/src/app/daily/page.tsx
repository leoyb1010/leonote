import { AppShell } from "@/components/app-shell";
import { ServerDailyClient } from "@/components/server-daily-client";

export default function DailyPage() {
  return (
    <AppShell title="每日笔记" subtitle="按更新时间快速回顾今天、昨天与更早内容。" current="/daily">
      <ServerDailyClient />
    </AppShell>
  );
}
