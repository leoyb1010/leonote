"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Heart, RotateCcw, Trash2 } from "lucide-react";
import { ServerNoteEditor } from "@/components/server-note-editor";
import { Card } from "@/components/base/Card";
import { Button } from "@/components/base/Button";

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
  project?: { id: string; name: string } | null;
  attachments?: {
    id: string;
    noteId: string;
    filename: string;
    mimeType: string;
    size: number;
    url: string;
  }[];
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
    return () => { active = false; };
  }, [id]);

  const reload = async () => {
    const res = await fetch(`/api/notes/${id}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok) { setNote(data.note); setMessage(""); }
  };

  const patch = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) await reload();
  };
  const moveToTrash = async () => {
    if (!window.confirm("要把它移入回收站吗？之后仍可恢复。")) return;
    const res = await fetch(`/api/notes/${id}/trash`, { method: "POST" });
    if (res.ok) router.push("/trash");
  };
  const restore = async () => {
    const res = await fetch(`/api/notes/${id}/restore`, { method: "POST" });
    if (res.ok) await reload();
  };
  const removeForever = async () => {
    if (!window.confirm("这一步不可恢复。请确认你真的不再需要它。")) return;
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/trash");
  };

  if (!note) {
    return (
      <Card padding="sm">
        <p className="text-sm text-[var(--text-muted)]">{message}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card padding="sm">
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" icon={<Heart size={14} />} onClick={() => void patch({ favorite: !note.favorite })}>
            {note.favorite ? "取消收藏" : "收藏"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void patch({ pinned: !note.pinned })}>
            {note.pinned ? "取消置顶" : "置顶"}
          </Button>
          <Button variant="ghost" size="sm" icon={<Archive size={14} />} onClick={() => void patch({ archived: !note.archived })}>
            {note.archived ? "取消归档" : "归档"}
          </Button>
          {note.deletedAt ? (
            <>
              <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={() => void restore()}>
                恢复
              </Button>
              <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={() => void removeForever()}>
                彻底删除
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" icon={<Trash2 size={14} />} onClick={() => void moveToTrash()}>
              移入回收站
            </Button>
          )}
        </div>
      </Card>
      <ServerNoteEditor initialNote={note} />
    </div>
  );
}
