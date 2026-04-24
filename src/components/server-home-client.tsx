"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ApiNote = {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  updatedAt: string;
  favorite: boolean;
  pinned: boolean;
};

const quickActions = [
  { label: "继续记录", href: "/notes/new" },
  { label: "搜索", href: "/search" },
  { label: "收藏", href: "/favorites" },
  { label: "每日", href: "/daily" },
];

export function ServerHomeClient() {
  const [items, setItems] = useState<ApiNote[]>([]);
  const [message, setMessage] = useState("正在加载服务端数据…");

  useEffect(() => {
    fetch("/api/notes?status=active", { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setMessage(data.message || "请先登录");
          return;
        }
        setItems(data.notes || []);
        setMessage("");
      })
      .catch(() => setMessage("加载失败"));
  }, []);

  const recent = items.slice(0, 5);
  const tags = Array.from(new Set(items.flatMap((note) => note.tags))).slice(0, 8);
  const counts = useMemo(() => ({ favorite: items.filter((n) => n.favorite).length, pinned: items.filter((n) => n.pinned).length, total: items.length }), [items]);

  return (
    <>
      <section className="mb-6 rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
        <p className="mb-3 text-sm text-[#666]">继续写</p>
        <Link href="/notes/new" className="block rounded-2xl bg-[#f7f7f5] p-4 text-sm text-[#666] transition-all duration-200 hover:bg-white hover:shadow-[0_0_0_1px_rgba(17,17,17,0.06)]">现在想记什么？直接开始。</Link>
        <div className="mt-4 grid grid-cols-4 gap-2">{quickActions.map((item) => <Link key={item.label} href={item.href} className="rounded-2xl bg-[#f3f2ef] px-3 py-3 text-center text-xs text-[#333] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#ebe8e1] active:scale-[0.98]">{item.label}</Link>)}</div>
      </section>
      {message ? <section className="mb-6 rounded-[24px] bg-white p-4 text-sm text-[#666]">{message}</section> : null}
      <section className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-[24px] bg-white p-4 text-center"><div className="text-2xl font-semibold">{counts.total}</div><div className="mt-1 text-xs text-[#777]">最近活跃</div></div>
        <div className="rounded-[24px] bg-white p-4 text-center"><div className="text-2xl font-semibold">{counts.favorite}</div><div className="mt-1 text-xs text-[#777]">收藏</div></div>
        <div className="rounded-[24px] bg-white p-4 text-center"><div className="text-2xl font-semibold">{counts.pinned}</div><div className="mt-1 text-xs text-[#777]">置顶</div></div>
      </section>
      <section className="mb-6">
        <div className="mb-3 text-sm font-medium">常用标签</div>
        <div className="flex gap-2 overflow-x-auto pb-1">{(tags.length ? tags : ["暂无标签"]).map((tag, index) => <Link key={tag} href={tag === "暂无标签" ? "/notes" : `/notes?tag=${encodeURIComponent(tag)}`} className={`shrink-0 rounded-full px-4 py-2 text-sm ${index === 0 ? "bg-[#111] text-white" : "border border-[#e7e4de] bg-white text-[#555]"}`}>{tag}</Link>)}</div>
      </section>
      <section className="mb-4 flex items-center justify-between"><h2 className="text-lg font-medium">最近更新</h2><Link className="text-sm text-[#777]" href="/notes">查看全部</Link></section>
      {recent.length === 0 ? <section className="rounded-[24px] bg-white p-5 text-sm leading-6 text-[#666]">还没有笔记，先创建第一条记录。</section> : null}
      <section className="space-y-3">{recent.map((note) => <Link key={note.id} href={`/notes/${note.id}`} className="block rounded-[24px] border border-[#e7e4de] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.03)] transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_14px_32px_rgba(0,0,0,0.06)]"><div className="mb-3 flex items-center justify-between gap-3"><div className="inline-flex rounded-full bg-[#f1efe9] px-2 py-1 text-xs text-[#666]">{note.tags[0] || "未分类"}</div><span className="text-xs text-[#888]">{new Date(note.updatedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span></div><h3 className="text-base font-medium text-[#111]">{note.title}</h3><p className="mt-2 text-sm leading-6 text-[#666]">{note.excerpt}</p></Link>)}</section>
    </>
  );
}
