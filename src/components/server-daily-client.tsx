"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DailyItem = {
  id: string;
  date: string;
  note: { id: string; title: string; excerpt: string };
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
      {message ? <div className="rounded-[24px] bg-white p-4 text-sm text-[#666]">{message}</div> : null}
      {today ? <Link href={`/notes/${today.note.id}`} className="block rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_14px_32px_rgba(0,0,0,0.06)]"><div className="text-xs text-[#888]">今日入口</div><h2 className="mt-2 text-base font-medium">{today.note.title}</h2><p className="mt-2 text-sm leading-6 text-[#666]">{today.note.excerpt || "今天的每日笔记已经创建，点击继续写。"}</p></Link> : null}
      <div className="space-y-3">
        <div className="text-sm font-medium text-[#555]">最近几天</div>
        {recent.map((item) => <Link key={item.id} href={`/notes/${item.note.id}`} className="block rounded-[24px] border border-[#e7e4de] bg-white p-4 transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_14px_32px_rgba(0,0,0,0.06)]"><div className="text-xs text-[#888]">{new Date(item.date).toLocaleDateString("zh-CN")}</div><h2 className="mt-2 text-base font-medium">{item.note.title}</h2><p className="mt-2 text-sm leading-6 text-[#666]">{item.note.excerpt || "点击继续查看这一天的记录。"}</p></Link>)}
      </div>
    </section>
  );
}
