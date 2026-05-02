"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { NoteCard } from "@/components/notes/NoteCard";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { staggerContainer, staggerItem } from "@/lib/animations";

type ApiNote = {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  updatedAt: string;
  favorite?: boolean;
  archived?: boolean;
  pinned?: boolean;
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
    setMessage(list.length ? "" : "当前还没有相关内容。");
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
        setMessage(list.length ? "" : "当前还没有相关内容。");
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

  if (message && !items.length) return <GlassPanel blur="lg" glow="soft" className="rounded-[var(--radius-lg)] p-4 text-sm text-[var(--text-secondary)]">{message}</GlassPanel>;

  return (
    <section className="space-y-4">
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 xl:grid-cols-2">
        {items.map((note) => (
          <motion.div key={note.id} variants={staggerItem} className="space-y-3">
            <NoteCard note={note} />
            <div className="flex flex-wrap gap-2 px-1">
              {type === "favorite" ? <button onClick={() => void patch(note.id, { favorite: false })} type="button" className="rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-3 py-2 text-xs text-[var(--text-secondary)] transition hover:bg-[rgba(255,255,255,0.10)]">取消收藏</button> : null}
              {type === "archived" ? <button onClick={() => void patch(note.id, { archived: false })} type="button" className="rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-3 py-2 text-xs text-[var(--text-secondary)] transition hover:bg-[rgba(255,255,255,0.10)]">取消归档</button> : null}
              {type === "deleted" ? <><button onClick={() => void restore(note.id)} type="button" className="rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-3 py-2 text-xs text-[var(--text-secondary)] transition hover:bg-[rgba(255,255,255,0.10)]">恢复</button><button onClick={() => void remove(note.id)} type="button" className="rounded-full bg-[rgba(251,113,133,0.14)] px-3 py-2 text-xs text-rose-200 transition hover:bg-[rgba(251,113,133,0.20)]">彻底删除</button></> : null}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
