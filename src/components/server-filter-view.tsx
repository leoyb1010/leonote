"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ApiNote = {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  updatedAt: string;
  favorite?: boolean;
};

export function ServerFilterView({ type }: { type: "favorite" | "archived" | "deleted" }) {
  const [items, setItems] = useState<ApiNote[]>([]);
  const [message, setMessage] = useState("正在加载…");
  const status = type === "archived" ? "archived" : type === "deleted" ? "trash" : "active";

  const refreshList = async () => {
    const res = await fetch(`/api/notes?status=${status}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setItems([]);
      setMessage(data.message || "加载失败");
      return;
    }
    const list = type === "favorite" ? (data.notes || []).filter((note: { favorite: boolean }) => note.favorite) : (data.notes || []);
    setItems(list);
    setMessage("");
  };

  useEffect(() => {
    let active = true;
    fetch(`/api/notes?status=${status}`, { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!active) return;
        if (!ok) {
          setItems([]);
          setMessage(data.message || "加载失败");
          return;
        }
        const list = type === "favorite" ? (data.notes || []).filter((note: { favorite: boolean }) => note.favorite) : (data.notes || []);
        setItems(list);
        setMessage("");
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        setMessage("加载失败");
      });
    return () => {
      active = false;
    };
  }, [status, type]);

  const patch = async (id: string, payload: Record<string, unknown>) => {
    const res = await fetch(`/api/notes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) await refreshList();
  };
  const restore = async (id: string) => { const res = await fetch(`/api/notes/${id}/restore`, { method: "POST" }); if (res.ok) await refreshList(); };
  const remove = async (id: string) => { if (!window.confirm("确认彻底删除？")) return; const res = await fetch(`/api/notes/${id}`, { method: "DELETE" }); if (res.ok) await refreshList(); };

  if (message && !items.length) return <div className="rounded-[24px] bg-white p-4 text-sm text-[#666]">{message}</div>;
  if (!items.length) return <div className="rounded-[24px] bg-white p-4 text-sm text-[#666]">当前还没有相关内容。</div>;

  return (
    <section className="space-y-3">
      {items.map((note) => (
        <div key={note.id} className="rounded-[24px] border border-[#e7e4de] bg-white p-4 transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_14px_32px_rgba(0,0,0,0.06)]">
          <Link href={`/notes/${note.id}`} className="block">
            <div className="text-xs text-[#888]">{new Date(note.updatedAt).toLocaleString("zh-CN")}</div>
            <h2 className="mt-2 text-base font-medium">{note.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#666]">{note.excerpt}</p>
          </Link>
          <div className="mt-3 flex flex-wrap gap-2">
            {type === "favorite" ? <button onClick={() => void patch(note.id, { favorite: false })} type="button" className="rounded-full bg-[#f3f2ef] px-3 py-2 text-xs text-[#555] transition-all duration-200 hover:bg-[#ebe8e1] active:scale-[0.98]">取消收藏</button> : null}
            {type === "archived" ? <button onClick={() => void patch(note.id, { archived: false })} type="button" className="rounded-full bg-[#f3f2ef] px-3 py-2 text-xs text-[#555] transition-all duration-200 hover:bg-[#ebe8e1] active:scale-[0.98]">取消归档</button> : null}
            {type === "deleted" ? <><button onClick={() => void restore(note.id)} type="button" className="rounded-full bg-[#f3f2ef] px-3 py-2 text-xs text-[#555] transition-all duration-200 hover:bg-[#ebe8e1] active:scale-[0.98]">恢复</button><button onClick={() => void remove(note.id)} type="button" className="rounded-full bg-[#111] px-3 py-2 text-xs text-white transition-all duration-200 hover:opacity-95 active:scale-[0.98]">彻底删除</button></> : null}
          </div>
        </div>
      ))}
    </section>
  );
}
