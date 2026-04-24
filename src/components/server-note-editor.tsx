"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type NoteShape = {
  id?: string;
  title?: string;
  content?: string;
  tags?: string[];
  project?: { id: string; name: string } | null;
};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const statusText: Record<SaveState, string> = {
  idle: "未修改",
  dirty: "待保存",
  saving: "保存中...",
  saved: "已保存",
  error: "保存失败",
};

const AUTOSAVE_KEY = "leonote.autosave.enabled";

export function ServerNoteEditor({ initialNote }: { initialNote?: NoteShape }) {
  const router = useRouter();
  const [noteId, setNoteId] = useState(initialNote?.id ?? "");
  const [title, setTitle] = useState(initialNote?.title ?? "");
  const [content, setContent] = useState(initialNote?.content ?? "");
  const [tagsInput, setTagsInput] = useState((initialNote?.tags ?? []).join(" "));
  const [projectName, setProjectName] = useState(initialNote?.project?.name ?? "");
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [hasEdited, setHasEdited] = useState(false);
  const [showAfterSave, setShowAfterSave] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(AUTOSAVE_KEY) === "1";
  });
  const initialized = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isNewNote = !noteId;
  const stats = useMemo(() => {
    const length = content.trim().length;
    return { words: length === 0 ? 0 : content.trim().split(/\s+/).length, chars: length };
  }, [content]);

  const cancelAutoSaveTimer = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  };

  const buildPayload = useCallback(() => ({
    title: title || "未命名笔记",
    content,
    excerpt: content.slice(0, 120) || "暂无摘要",
    tags: tagsInput.split(/[\s,，]+/).map((item) => item.trim()).filter(Boolean),
    projectName: projectName.trim() || undefined,
  }), [title, content, tagsInput, projectName]);

  const saveDraft = useCallback(async (manual = false) => {
    cancelAutoSaveTimer();
    if (saveState === "saving") return;
    setSaveState("saving");
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
    if (manual) {
      setMessage("已保存");
      setShowAfterSave(true);
    } else {
      setMessage("已自动保存");
    }
    router.refresh();
  }, [buildPayload, noteId, router, saveState]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    setHasEdited(true);
    setSaveState("dirty");
    setShowAfterSave(false);
  }, [title, content, tagsInput, projectName]);

  useEffect(() => {
    cancelAutoSaveTimer();
    if (!autoSaveEnabled || !hasEdited || isNewNote || saveState !== "dirty") return;
    autoSaveTimerRef.current = setTimeout(() => {
      void saveDraft(false);
    }, 2600);
    return () => cancelAutoSaveTimer();
  }, [autoSaveEnabled, hasEdited, isNewNote, saveState, saveDraft]);

  useEffect(() => () => cancelAutoSaveTimer(), []);

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

  const toggleAutoSave = () => {
    const next = !autoSaveEnabled;
    setAutoSaveEnabled(next);
    window.localStorage.setItem(AUTOSAVE_KEY, next ? "1" : "0");
    if (!next) cancelAutoSaveTimer();
    setMessage(next ? "已开启自动保存，仅对已有笔记生效。" : "已关闭自动保存，当前仅手动保存。");
  };

  return (
    <>
      <section className="glass-panel animate-rise space-y-4 rounded-[28px] p-5">
        <div className="flex items-center justify-between gap-3 text-xs text-[#777]"><span>{statusText[saveState]}</span><span>{stats.words} 词 · {stats.chars} 字符</span></div>
        <input aria-label="笔记标题" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="输入标题" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-lg font-medium text-[#111] outline-none transition-all duration-300 focus:-translate-y-[1px] focus:bg-white focus:shadow-[0_16px_40px_rgba(0,0,0,0.06)]" />
        <input aria-label="所属项目" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="可选：所属项目，例如 Leonote" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm text-[#333] outline-none transition-all duration-300 focus:-translate-y-[1px] focus:bg-white focus:shadow-[0_16px_40px_rgba(0,0,0,0.06)]" />
        <input aria-label="笔记标签" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="输入标签，使用空格分隔" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm text-[#333] outline-none transition-all duration-300 focus:-translate-y-[1px] focus:bg-white focus:shadow-[0_16px_40px_rgba(0,0,0,0.06)]" />
        <textarea aria-label="笔记内容" value={content} onChange={(e) => setContent(e.target.value)} placeholder="开始记录内容……" className="min-h-[320px] w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm leading-7 text-[#333] outline-none transition-all duration-300 focus:-translate-y-[1px] focus:bg-white focus:shadow-[0_16px_40px_rgba(0,0,0,0.06)]" />
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#777]">
          <div className="flex items-center gap-3">
            <button type="button" onClick={toggleAutoSave} className={`rounded-full px-3 py-2 text-xs transition-all duration-300 active:scale-[0.98] ${autoSaveEnabled ? "bg-[#111] text-white shadow-[0_10px_24px_rgba(17,17,17,0.18)]" : "bg-[#f3f2ef] text-[#555] hover:bg-[#ebe8e1]"}`}>
              自动保存：{autoSaveEnabled ? "开" : "关"}
            </button>
            <span>{isNewNote ? "新建页默认不自动保存。" : autoSaveEnabled ? "已有笔记停止输入约 2.6 秒后自动保存。" : "当前为纯手动保存模式。"}</span>
          </div>
          <button onClick={() => void saveDraft(true)} className="rounded-full bg-[#111] px-4 py-2 text-sm text-white transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(17,17,17,0.24)] active:scale-[0.98]" type="button">手动保存</button>
        </div>
        {message ? <div className="rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-[#666] transition-all duration-300">{message}</div> : null}
      </section>

      {showAfterSave ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,17,17,0.28)] px-5 backdrop-blur-sm">
          <div className="animate-rise w-full max-w-sm rounded-[28px] bg-white p-5 shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
            <div className="text-sm text-[#777]">保存成功</div>
            <h3 className="mt-2 text-lg font-semibold text-[#111]">要关闭当前页面并回到目录吗？</h3>
            <p className="mt-2 text-sm leading-6 text-[#666]">自动保存不会再抢这个弹窗；当前开关也会记住你的偏好。</p>
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setShowAfterSave(false)} className="flex-1 rounded-full bg-[#f3f2ef] px-4 py-3 text-sm text-[#333] transition-all duration-300 hover:bg-[#ebe8e1] active:scale-[0.98]">继续编辑</button>
              <button type="button" onClick={() => router.push("/notes")} className="flex-1 rounded-full bg-[#111] px-4 py-3 text-sm text-white transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(17,17,17,0.24)] active:scale-[0.98]">回到目录</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
