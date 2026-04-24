"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type NoteShape = {
  id?: string;
  title?: string;
  content?: string;
  tags?: string[];
};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const statusText: Record<SaveState, string> = {
  idle: "未修改",
  dirty: "待保存",
  saving: "保存中...",
  saved: "已保存",
  error: "保存失败",
};

export function ServerNoteEditor({ initialNote }: { initialNote?: NoteShape }) {
  const router = useRouter();
  const [noteId, setNoteId] = useState(initialNote?.id ?? "");
  const [title, setTitle] = useState(initialNote?.title ?? "");
  const [content, setContent] = useState(initialNote?.content ?? "");
  const [tagsInput, setTagsInput] = useState((initialNote?.tags ?? []).join(" "));
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const initialized = useRef(false);

  const stats = useMemo(() => {
    const length = content.trim().length;
    return { words: length === 0 ? 0 : content.trim().split(/\s+/).length, chars: length };
  }, [content]);

  const buildPayload = useCallback(() => ({
    title: title || "未命名笔记",
    content,
    excerpt: content.slice(0, 120) || "暂无摘要",
    tags: tagsInput.split(/[\s,，]+/).map((item) => item.trim()).filter(Boolean),
  }), [title, content, tagsInput]);

  const saveDraft = useCallback(async (manual = false) => {
    setSaveState((prev) => (prev === "saving" ? prev : "saving"));
    setMessage("");
    const payload = buildPayload();
    const currentId = noteId;
    const res = await fetch(currentId ? `/api/notes/${currentId}` : "/api/notes", {
      method: currentId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setSaveState("error");
      setMessage(data.message || "保存失败");
      return;
    }
    const id = data.note.id as string;
    if (!currentId) {
      setNoteId(id);
      router.replace(`/notes/${id}`);
    }
    setSaveState("saved");
    if (manual) setMessage("已立即保存");
    router.refresh();
  }, [buildPayload, noteId, router]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    setSaveState("dirty");
  }, [title, content, tagsInput]);

  useEffect(() => {
    if (saveState !== "dirty") return;
    const timer = setTimeout(() => {
      void saveDraft(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [saveState, saveDraft]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveState === "dirty" || saveState === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [saveState]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void saveDraft(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [saveDraft]);

  return (
    <section className="space-y-4 rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between gap-3 text-xs text-[#777]"><span>{statusText[saveState]}</span><span>{stats.words} 词 · {stats.chars} 字符</span></div>
      <input aria-label="笔记标题" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="输入标题" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-lg font-medium text-[#111] outline-none transition-all duration-200 focus:scale-[1.01] focus:bg-white focus:shadow-[0_0_0_1px_rgba(17,17,17,0.08)]" />
      <input aria-label="笔记标签" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="输入标签，使用空格分隔" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm text-[#333] outline-none transition-all duration-200 focus:scale-[1.01] focus:bg-white focus:shadow-[0_0_0_1px_rgba(17,17,17,0.08)]" />
      <textarea aria-label="笔记内容" value={content} onChange={(e) => setContent(e.target.value)} placeholder="开始记录内容……" className="min-h-[320px] w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm leading-7 text-[#333] outline-none transition-all duration-200 focus:scale-[1.01] focus:bg-white focus:shadow-[0_0_0_1px_rgba(17,17,17,0.08)]" />
      <div className="flex items-center justify-end gap-3 text-xs text-[#777]"><button onClick={() => void saveDraft(true)} className="rounded-full bg-[#111] px-4 py-2 text-sm text-white transition-all duration-200 hover:-translate-y-[1px] hover:opacity-95 active:scale-[0.98]" type="button">立即保存</button></div>
      {message ? <div className="rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-[#666]">{message}</div> : null}
    </section>
  );
}
