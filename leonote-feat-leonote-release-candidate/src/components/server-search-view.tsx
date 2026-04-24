"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ApiNote = {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
};

export function ServerSearchView() {
  const [items, setItems] = useState<ApiNote[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("输入关键词开始搜索");

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setItems([]);
        setMessage("输入关键词开始搜索");
        return;
      }
      const res = await fetch(`/api/notes?q=${encodeURIComponent(query.trim())}`, { cache: "no-store", signal: controller.signal });
      const data = await res.json();
      if (!res.ok) {
        setItems([]);
        setMessage(data.message || "搜索失败");
        return;
      }
      setItems(data.notes || []);
      setMessage(data.notes?.length ? "" : "没有找到匹配结果。");
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <section className="space-y-4">
      <div className="rounded-[24px] bg-white p-4 transition-all duration-300 hover:shadow-[0_14px_32px_rgba(0,0,0,0.06)]">
        <input aria-label="搜索笔记" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索标题、正文、摘要或标签" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm text-[#333] outline-none transition-all duration-200 focus:scale-[1.01] focus:bg-white focus:shadow-[0_0_0_1px_rgba(17,17,17,0.08)]" />
      </div>
      {message ? <div className="rounded-[24px] bg-white p-4 text-sm text-[#666]">{message}</div> : null}
      <div className="space-y-3">
        {items.map((note) => (
          <Link key={note.id} href={`/notes/${note.id}`} className="block rounded-[24px] border border-[#e7e4de] bg-white p-4 transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_14px_32px_rgba(0,0,0,0.06)]">
            <div className="text-xs text-[#888]">{note.tags.join(" · ") || "未分类"}</div>
            <h2 className="mt-2 text-base font-medium">{note.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#666]">{note.excerpt}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
