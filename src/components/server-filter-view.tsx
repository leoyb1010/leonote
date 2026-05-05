"use client";

import { useEffect, useState } from "react";
import { NoteRow } from "@/components/notes/NoteRow";
import { Button } from "@/components/base/Button";

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
    const list = type === "favorite"
      ? (data.notes || []).filter((note: { favorite: boolean }) => note.favorite)
      : (data.notes || []);
    setItems(list);
    setMessage(list.length ? "" : "当前还没有相关内容。");
  };

  useEffect(() => {
    let active = true;
    fetch(`/api/notes?status=${status}`, { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!active) return;
        if (!ok) { setItems([]); setMessage(data.message || "加载失败"); return; }
        const list = type === "favorite"
          ? (data.notes || []).filter((note: { favorite: boolean }) => note.favorite)
          : (data.notes || []);
        setItems(list);
        setMessage(list.length ? "" : "当前还没有相关内容。");
      })
      .catch(() => { if (!active) return; setItems([]); setMessage("加载失败"); });
    return () => { active = false; };
  }, [status, type]);

  const patch = async (id: string, payload: Record<string, unknown>) => {
    const res = await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) await refreshList();
  };
  const restore = async (id: string) => {
    const res = await fetch(`/api/notes/${id}/restore`, { method: "POST" });
    if (res.ok) await refreshList();
  };
  const remove = async (id: string) => {
    if (!window.confirm("确认彻底删除？")) return;
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (res.ok) await refreshList();
  };

  if (message && !items.length) {
    return (
      <p className="text-sm text-[var(--text-muted)] py-8 text-center">{message}</p>
    );
  }

  return (
    <section className="space-y-4">
      <div className="divide-y divide-[var(--border-subtle)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-1">
        {items.map((note) => (
          <div key={note.id}>
            <NoteRow note={note} />
            <div className="flex flex-wrap gap-2 px-3.5 pb-3">
              {type === "favorite" && (
                <Button variant="ghost" size="sm" onClick={() => void patch(note.id, { favorite: false })}>取消收藏</Button>
              )}
              {type === "archived" && (
                <Button variant="ghost" size="sm" onClick={() => void patch(note.id, { archived: false })}>取消归档</Button>
              )}
              {type === "deleted" && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => void restore(note.id)}>恢复</Button>
                  <Button variant="danger" size="sm" onClick={() => void remove(note.id)}>彻底删除</Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
