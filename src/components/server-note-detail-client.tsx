"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ServerNoteEditor } from "@/components/server-note-editor";

type ApiNote = {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  favorite: boolean;
  pinned: boolean;
  archived: boolean;
  deletedAt: string | null;
};

export function ServerNoteDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = useState<ApiNote | null>(null);
  const [message, setMessage] = useState("正在加载笔记…");

  useEffect(() => {
    let active = true;
    fetch(`/api/notes/${id}`, { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!active) return;
        if (!ok) {
          setMessage(data.message || "加载失败");
          setNote(null);
          return;
        }
        setNote(data.note);
        setMessage("");
      })
      .catch(() => {
        if (!active) return;
        setMessage("加载失败");
        setNote(null);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const reload = async () => {
    const res = await fetch(`/api/notes/${id}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok) {
      setNote(data.note);
      setMessage("");
    }
  };

  const patch = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/notes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) await reload();
  };
  const moveToTrash = async () => { if (!window.confirm("确认将这条笔记移入回收站？")) return; const res = await fetch(`/api/notes/${id}/trash`, { method: "POST" }); if (res.ok) router.push("/trash"); };
  const restore = async () => { const res = await fetch(`/api/notes/${id}/restore`, { method: "POST" }); if (res.ok) await reload(); };
  const removeForever = async () => { if (!window.confirm("确认彻底删除？删除后不可恢复。")) return; const res = await fetch(`/api/notes/${id}`, { method: "DELETE" }); if (res.ok) router.push("/trash"); };

  if (!note) return <div className="rounded-[24px] bg-white p-4 text-sm text-[#666]">{message}</div>;

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap gap-2 rounded-[24px] bg-white p-4 text-xs text-[#555] shadow-[0_8px_24px_rgba(0,0,0,0.03)]">
        <button onClick={() => void patch({ favorite: !note.favorite })} type="button" className="rounded-full bg-[#f3f2ef] px-3 py-2 transition-all duration-200 hover:bg-[#ebe8e1] active:scale-[0.98]">{note.favorite ? "取消收藏" : "收藏"}</button>
        <button onClick={() => void patch({ pinned: !note.pinned })} type="button" className="rounded-full bg-[#f3f2ef] px-3 py-2 transition-all duration-200 hover:bg-[#ebe8e1] active:scale-[0.98]">{note.pinned ? "取消置顶" : "置顶"}</button>
        <button onClick={() => void patch({ archived: !note.archived })} type="button" className="rounded-full bg-[#f3f2ef] px-3 py-2 transition-all duration-200 hover:bg-[#ebe8e1] active:scale-[0.98]">{note.archived ? "取消归档" : "归档"}</button>
        {note.deletedAt ? <><button onClick={() => void restore()} type="button" className="rounded-full bg-[#f3f2ef] px-3 py-2 transition-all duration-200 hover:bg-[#ebe8e1] active:scale-[0.98]">恢复</button><button onClick={() => void removeForever()} type="button" className="rounded-full bg-[#111] px-3 py-2 text-white transition-all duration-200 hover:opacity-95 active:scale-[0.98]">彻底删除</button></> : <button onClick={() => void moveToTrash()} type="button" className="rounded-full bg-[#111] px-3 py-2 text-white transition-all duration-200 hover:opacity-95 active:scale-[0.98]">移入回收站</button>}
      </section>
      <ServerNoteEditor initialNote={note} />
    </div>
  );
}
