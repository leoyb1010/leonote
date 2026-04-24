"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ApiNote = {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  project?: { name: string } | null;
};

export function ServerNoteList() {
  const [items, setItems] = useState<ApiNote[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("正在加载服务端数据…");

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/notes?${params.toString()}`, { cache: "no-store", signal: controller.signal });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "请先登录");
        setItems([]);
        return;
      }
      setItems(data.notes || []);
      setMessage(data.notes?.length ? "" : "当前还没有笔记");
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <section className="space-y-4">
      <div className="glass-panel animate-rise rounded-[24px] p-4 transition-all duration-300 hover:shadow-[0_14px_32px_rgba(0,0,0,0.06)]">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索标题、内容、标签或项目" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm outline-none transition-all duration-300 focus:-translate-y-[1px] focus:bg-white focus:shadow-[0_16px_40px_rgba(0,0,0,0.06)]" />
      </div>
      {message ? <div className="glass-panel rounded-[24px] p-4 text-sm text-[#666]">{message}</div> : null}
      <div className="space-y-3">
        {items.map((note, index) => (
          <Link key={note.id} href={`/notes/${note.id}`} className="glass-panel animate-rise block rounded-[24px] p-4 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)]" style={{ animationDelay: `${index * 40}ms` }}>
            <div className="flex items-center justify-between gap-3 text-xs text-[#888]"><span>{note.project?.name ? `项目 · ${note.project.name}` : note.tags.join(" · ") || "未分类"}</span><span>{note.project?.name && note.tags.length ? note.tags.join(" · ") : ""}</span></div>
            <h2 className="mt-2 text-base font-medium">{note.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#666]">{note.excerpt}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
