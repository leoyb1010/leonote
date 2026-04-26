"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Heart, RotateCcw, Trash2 } from "lucide-react";
import { ServerNoteEditor } from "@/components/server-note-editor";
import { GlassPanel } from "@/components/ui/GlassPanel";

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

  if (!note) return <GlassPanel blur="lg" glow="soft" className="rounded-[24px] p-4 text-sm text-white/62">{message}</GlassPanel>;

  return (
    <div className="space-y-3">
      <GlassPanel blur="lg" glow="soft" className="rounded-[18px] px-3 py-2">
        <div className="flex flex-wrap gap-1.5 text-xs text-white/56">
          <button onClick={() => void patch({ favorite: !note.favorite })} type="button" className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 transition hover:bg-white/8 hover:text-white"><Heart className="h-3.5 w-3.5" />{note.favorite ? "取消收藏" : "收藏"}</button>
          <button onClick={() => void patch({ pinned: !note.pinned })} type="button" className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 transition hover:bg-white/8 hover:text-white">{note.pinned ? "取消置顶" : "置顶"}</button>
          <button onClick={() => void patch({ archived: !note.archived })} type="button" className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 transition hover:bg-white/8 hover:text-white"><Archive className="h-3.5 w-3.5" />{note.archived ? "取消归档" : "归档"}</button>
          {note.deletedAt ? <><button onClick={() => void restore()} type="button" className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 transition hover:bg-white/8 hover:text-white"><RotateCcw className="h-3.5 w-3.5" />恢复</button><button onClick={() => void removeForever()} type="button" className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(251,113,133,0.12)] px-3 py-1.5 text-rose-200 transition hover:bg-[rgba(251,113,133,0.18)]"><Trash2 className="h-3.5 w-3.5" />彻底删除</button></> : <button onClick={() => void moveToTrash()} type="button" className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/10 bg-[rgba(251,113,133,0.10)] px-3 py-1.5 text-rose-100/76 transition hover:bg-[rgba(251,113,133,0.16)]"><Trash2 className="h-3.5 w-3.5" />移入回收站</button>}
        </div>
      </GlassPanel>
      <ServerNoteEditor initialNote={note} />
    </div>
  );
}
