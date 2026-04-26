"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { NoteCard } from "@/components/notes/NoteCard";

type DailyItem = {
  id: string;
  date: string;
  note: { id: string; title: string; excerpt: string; tags?: string[] };
};

export function ServerDailyClient() {
  const [today, setToday] = useState<DailyItem | null>(null);
  const [recent, setRecent] = useState<DailyItem[]>([]);
  const [message, setMessage] = useState("正在加载每日笔记…");

  useEffect(() => {
    fetch("/api/daily", { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setMessage(data.message || "加载失败");
          return;
        }
        setToday(data.today);
        setRecent(data.recent || []);
        setMessage("");
      })
      .catch(() => setMessage("加载失败"));
  }, []);

  return (
    <section className="space-y-5">
      {message ? <GlassPanel blur="lg" glow="soft" className="rounded-[24px] p-4 text-sm text-white/60">{message}</GlassPanel> : null}
      {today ? (
        <GlassPanel blur="xl" glow="brand" className="rounded-[24px] p-5">
          <Link href={`/notes/${today.note.id}`} className="block">
            <div className="inline-flex items-center gap-2 text-xs text-cyan-200/72"><CalendarDays className="h-4 w-4" />今日入口</div>
            <h2 className="mt-3 text-lg font-medium text-white">{today.note.title}</h2>
            <p className="mt-2 text-sm leading-7 text-white/60">{today.note.excerpt || "今天的每日笔记已经创建，点击继续写。"}</p>
          </Link>
        </GlassPanel>
      ) : null}
      <div className="space-y-3">
        <div className="text-sm font-medium text-white/72">最近几天</div>
        <div className="grid gap-4 xl:grid-cols-2">
          {recent.map((item) => (
            <NoteCard
              key={item.id}
              note={{
                id: item.note.id,
                title: item.note.title,
                excerpt: item.note.excerpt || "点击继续查看这一天的记录。",
                tags: item.note.tags || [new Date(item.date).toLocaleDateString("zh-CN")],
                updatedAt: item.date,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
