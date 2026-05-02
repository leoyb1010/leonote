"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Sparkles, Wand2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { summarizeExpand } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { ImportExportPanel } from "@/components/import-export-panel";
import { GlassPanel } from "@/components/ui/GlassPanel";

type NoteShape = {
  id?: string;
  title?: string;
  content?: string;
  tags?: string[];
  project?: { id: string; name: string } | null;
};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

type SummaryState = {
  status: "idle" | "loading" | "ready" | "inserting" | "error";
  text: string;
};

const statusText: Record<SaveState, string> = {
  idle: "未修改",
  dirty: "待保存",
  saving: "保存中...",
  saved: "已保存",
  error: "保存失败",
};

const AUTOSAVE_KEY = "leonote.autosave.enabled";

export function EnhancedEditor({ initialNote }: { initialNote?: NoteShape }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [noteId, setNoteId] = useState(initialNote?.id ?? "");
  const [title, setTitle] = useState(initialNote?.title ?? "");
  const [content, setContent] = useState(initialNote?.content ?? "");
  const [tagsInput, setTagsInput] = useState((initialNote?.tags ?? []).join(" "));
  const [projectName, setProjectName] = useState(initialNote?.project?.name ?? "");
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [hasEdited, setHasEdited] = useState(false);
  const [showAfterSave, setShowAfterSave] = useState(false);
  const [summary, setSummary] = useState<SummaryState>({ status: "idle", text: "" });
  const [saveBurst, setSaveBurst] = useState<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });
  const [focusRing, setFocusRing] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(AUTOSAVE_KEY) === "1";
  });

  const initialized = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isComposingRef = useRef(false);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

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

  const emitSavedBurst = useCallback(() => {
    const target = contentRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    setSaveBurst({ visible: true, x: rect.left + Math.min(rect.width - 96, rect.width * 0.7), y: rect.top + 28 });
    window.setTimeout(() => setSaveBurst((state) => ({ ...state, visible: false })), 1300);
  }, []);

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
    emitSavedBurst();
    if (manual) {
      setMessage("已保存");
      setShowAfterSave(true);
    } else {
      setMessage("已自动保存");
    }
    router.refresh();
  }, [buildPayload, emitSavedBurst, noteId, router, saveState]);

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
    if (!autoSaveEnabled || !hasEdited || isNewNote || saveState !== "dirty" || isComposingRef.current) return;
    autoSaveTimerRef.current = setTimeout(() => {
      if (isComposingRef.current) return;
      void saveDraft(false);
    }, 2600);
    return () => cancelAutoSaveTimer();
  }, [autoSaveEnabled, hasEdited, isNewNote, saveState, saveDraft]);

  useEffect(() => () => cancelAutoSaveTimer(), []);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (saveState === "dirty" || saveState === "saving") {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [saveState]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
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

  const handleCompositionStart = () => {
    isComposingRef.current = true;
    cancelAutoSaveTimer();
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
    if (autoSaveEnabled && hasEdited && !isNewNote && saveState === "dirty") {
      cancelAutoSaveTimer();
      autoSaveTimerRef.current = setTimeout(() => {
        void saveDraft(false);
      }, 2600);
    }
  };

  const handleImported = ({ content: importedContent, noteId: importedNoteId, mode }: { content?: string; noteId?: string; mode: string }) => {
    if (importedNoteId && !noteId) {
      window.location.href = `/notes/${importedNoteId}`;
      return;
    }
    if (typeof importedContent === "string" && importedNoteId === noteId) {
      setContent(importedContent);
      setSaveState("saved");
      setMessage(mode === "replace" ? "已用导入内容替换当前笔记。" : "已把导入内容追加到当前笔记。");
    }
  };

  const requestSummary = async () => {
    if (!noteId) {
      setMessage("请先保存笔记，再生成总结。");
      return;
    }
    setSummary({ status: "loading", text: "" });
    const res = await fetch(`/api/ai/notes/${noteId}/summarize`, { method: "POST" });
    const data = await res.json().catch(() => ({ summary: "" }));
    if (!res.ok) {
      setSummary({ status: "error", text: "" });
      setMessage(data.message || "总结失败");
      return;
    }
    setSummary({ status: "ready", text: data.summary || "已生成摘要，但内容为空。" });
  };

  const insertSummary = async () => {
    if (!summary.text.trim()) return;
    setSummary((state) => ({ ...state, status: "inserting" }));
    const text = `\n\n## AI 总结\n${summary.text}\n`;
    if (reduceMotion) {
      setContent((value) => `${value}${text}`);
      setSummary((state) => ({ ...state, status: "ready" }));
      return;
    }
    for (let index = 0; index < text.length; index += 6) {
      const chunk = text.slice(index, index + 6);
      await new Promise<void>((resolve) => {
        window.setTimeout(() => {
          setContent((value) => `${value}${chunk}`);
          resolve();
        }, 28);
      });
    }
    setSummary((state) => ({ ...state, status: "ready" }));
  };

  return (
    <div className="relative space-y-3">
      <AnimatePresence>
        {saveBurst.visible ? (
          <motion.div
            key="saved-burst"
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: -6, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.92 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed z-[60]"
            style={{ left: saveBurst.x, top: saveBurst.y }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/16 px-3 py-1.5 text-xs text-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.18)] backdrop-blur-[12px]">
              <Check className="h-3.5 w-3.5" /> 已保存
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {(summary.status === "ready" || summary.status === "inserting") && summary.text ? (
          <motion.section
            layout
            variants={summarizeExpand}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <GlassPanel blur="lg" glow="soft" className="rounded-[var(--radius-md)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold text-[var(--ai-accent)]">AI Summary</div>
                  <h3 className="mt-2 text-lg font-semibold text-white">已生成笔记总结</h3>
                </div>
                <button
                  type="button"
                  onClick={() => void insertSummary()}
                  disabled={summary.status === "inserting"}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.08)] px-4 py-2 text-sm text-white transition hover:bg-white/12 disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" />
                  {summary.status === "inserting" ? "插入中" : "一键插入"}
                </button>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[74">{summary.text}</p>
            </GlassPanel>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <GlassPanel blur="xl" glow="soft" hoverGlow className={cn("rounded-[var(--radius-lg)] p-3 transition duration-300 md:p-4", focusRing && "shadow-[0_0_0_1px_rgba(99,102,241,0.20),0_18px_58px_rgba(2,6,23,0.34)]")}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-default)] pb-3 text-xs text-[var(--text-muted)">
          <div className="inline-flex items-center gap-3">
            <span>{statusText[saveState]}</span>
            <span>{stats.words} 词 · {stats.chars} 字符</span>
          </div>
          <div className="inline-flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleAutoSave}
              className={cn(
                "rounded-full px-3 py-1.5 transition",
                autoSaveEnabled ? "bg-white/12 text-white" : "bg-white/[0.04] text-[54 hover:bg-[rgba(255,255,255,0.08)]",
              )}
            >
              自动保存：{autoSaveEnabled ? "开" : "关"}
            </button>
            <button
              type="button"
              onClick={() => void requestSummary()}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-white/[0.04] px-3 py-1.5 text-[var(--text-secondary)] transition hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
            >
              <Wand2 className="h-4 w-4" />
              {summary.status === "loading" ? "总结中" : "总结"}
            </button>
            <button onClick={() => void saveDraft(true)} className="rounded-full bg-white px-4 py-1.5 font-medium text-slate-950 shadow-[0_8px_22px_rgba(255,255,255,0.12)] transition hover:brightness-110" type="button">
              保存
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-3">
            <input
              aria-label="笔记标题"
              value={title}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              onFocus={() => setFocusRing(true)}
              onBlur={() => setFocusRing(false)}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="输入标题"
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[rgba(9,12,18,0.56)] px-4 py-3 text-xl font-semibold text-white outline-none transition focus:[box-shadow:0_0_0_1px_rgba(255,255,255,0.08),0_0_0_4px_rgba(99,102,241,0.10)]"
            />
            <div className="grid gap-2 md:grid-cols-2">
              <input
                aria-label="所属项目"
                value={projectName}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onFocus={() => setFocusRing(true)}
                onBlur={() => setFocusRing(false)}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="所属项目，例如 Leonote"
                className="w-full rounded-[16px] border border-[var(--border-subtle)] bg-[rgba(9,12,18,0.48)] px-3 py-2.5 text-sm text-[var(--text-secondary)] outline-none transition focus:[box-shadow:0_0_0_1px_rgba(255,255,255,0.08),0_0_0_4px_rgba(99,102,241,0.10)]"
              />
              <input
                aria-label="笔记标签"
                value={tagsInput}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onFocus={() => setFocusRing(true)}
                onBlur={() => setFocusRing(false)}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="标签，空格分隔"
                className="w-full rounded-[16px] border border-[var(--border-subtle)] bg-[rgba(9,12,18,0.48)] px-3 py-2.5 text-sm text-[var(--text-secondary)] outline-none transition focus:[box-shadow:0_0_0_1px_rgba(255,255,255,0.08),0_0_0_4px_rgba(99,102,241,0.10)]"
              />
            </div>
            <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] p-[1px]">
              <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-md)] opacity-0 transition duration-300 focus-within:opacity-100 [background:linear-gradient(135deg,rgba(99,102,241,0.48),rgba(34,211,238,0.28))]" />
              <div className="relative rounded-[19px] bg-[rgba(9,12,18,0.90)]">
                <div className="pointer-events-none absolute inset-x-4 bottom-0 h-20 bg-[linear-gradient(180deg,transparent,rgba(99,102,241,0.08),rgba(34,211,238,0.10))] opacity-0 transition-opacity duration-500 focus-within:opacity-100" />
                <textarea
                  ref={contentRef}
                  aria-label="笔记内容"
                  value={content}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  onFocus={() => setFocusRing(true)}
                  onBlur={() => setFocusRing(false)}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="开始记录内容……"
                  className="min-h-[58dvh] w-full resize-y rounded-[19px] bg-transparent px-4 py-4 text-[15px] leading-8 text-[86 outline-none lg:min-h-[620px]"
                />
              </div>
            </div>
          </div>

          <aside className="space-y-3 xl:pt-0">
            <GlassPanel blur="lg" glow="soft" className="max-h-[320px] overflow-auto rounded-[var(--radius-sm)] p-3">
              <div className="text-[11px] font-semibold text-[var(--text-muted)">Preview</div>
              <div className="mt-2 whitespace-pre-wrap text-sm leading-7 text-[64">{content || "实时预览当前笔记内容。"}</div>
            </GlassPanel>
            <GlassPanel blur="lg" glow="soft" className="rounded-[var(--radius-sm)] p-3">
              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-[var(--text-muted)">
                <span>Status</span>
                <span>{isNewNote ? "Draft" : "Saved Note"}</span>
              </div>
              <div className="mt-2 space-y-2 text-sm leading-6 text-[var(--text-muted)]">
                <p>{isNewNote ? "新建页默认不自动保存，先落第一版内容再建立笔记实体。" : autoSaveEnabled ? "已有笔记停止输入约 2.6 秒后自动保存。" : "当前为纯手动保存模式。"}</p>
                {message ? <div className="rounded-[14px] border border-[var(--border-default)] bg-[rgba(255,255,255,0.05)] px-3 py-2 text-[68">{message}</div> : null}
              </div>
            </GlassPanel>
          </aside>
        </div>
      </GlassPanel>

      <ImportExportPanel noteId={noteId || undefined} embedded onImported={handleImported} />

      <AnimatePresence>
        {showAfterSave ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5 backdrop-blur-[8px]">
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }} className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-raised)] p-5 shadow-[0_30px_90px_rgba(2,6,23,0.48)]">
              <div className="text-sm text-[var(--text-muted)]">保存成功</div>
              <h3 className="mt-2 text-lg font-semibold text-white">要关闭当前页面并回到目录吗？</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">自动保存偏好已记住。你也可以继续在这个沉浸式编辑空间里写下去。</p>
              <div className="mt-5 flex gap-3">
                <button type="button" onClick={() => setShowAfterSave(false)} className="flex-1 rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-[var(--text-secondary)] transition hover:bg-[rgba(255,255,255,0.10)]">继续编辑</button>
                <button type="button" onClick={() => router.push("/notes")} className="flex-1 rounded-full bg-white px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:brightness-110">回到目录</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
