"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Wand2, Sparkles, Eye, PenLine, Columns2, MoreHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ImportExportPanel } from "@/components/import-export-panel";
import { Button } from "@/components/base/Button";
import { MarkdownPreview } from "@/components/editor/MarkdownPreview";

type NoteShape = {
  id?: string;
  title?: string;
  content?: string;
  tags?: string[];
  project?: { id: string; name: string } | null;
};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
type ViewMode = "write" | "preview" | "split";

type SummaryState = {
  status: "idle" | "loading" | "ready" | "inserting" | "error";
  text: string;
};

const AUTOSAVE_KEY = "leonote.autosave.enabled";

export function EnhancedEditor({ initialNote }: { initialNote?: NoteShape }) {
  const router = useRouter();
  const [noteId, setNoteId] = useState(initialNote?.id ?? "");
  const [title, setTitle] = useState(initialNote?.title ?? "");
  const [content, setContent] = useState(initialNote?.content ?? "");
  const [tagsInput, setTagsInput] = useState((initialNote?.tags ?? []).join(" "));
  const [projectName, setProjectName] = useState(initialNote?.project?.name ?? "");
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [hasEdited, setHasEdited] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("write");
  const [showMore, setShowMore] = useState(false);
  const [summary, setSummary] = useState<SummaryState>({ status: "idle", text: "" });
  const [saveToast, setSaveToast] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(AUTOSAVE_KEY) !== "0";
  });

  const initialized = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const isComposingRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stats = useMemo(() => {
    const normalized = content.replace(/\s+/g, "").trim();
    return { chars: Array.from(normalized).length };
  }, [content]);

  const cancelAutoSaveTimer = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  };

  const buildPayload = useCallback(
    () => ({
      title: title || "未命名笔记",
      content,
      excerpt: content.slice(0, 120) || "暂无摘要",
      tags: tagsInput
        .split(/[\s,，]+/)
        .map((item) => item.trim())
        .filter(Boolean),
      projectName: projectName.trim() || undefined,
    }),
    [title, content, tagsInput, projectName],
  );

  const showToast = useCallback(() => {
    setSaveToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setSaveToast(false), 1800);
  }, []);

  const saveDraft = useCallback(
    async (manual = false) => {
      cancelAutoSaveTimer();
      if (savingRef.current) return;
      savingRef.current = true;
      setSaveState("saving");
      setMessage("");
      const payload = buildPayload();
      const currentId = noteId;
      try {
        const res = await fetch(
          currentId ? `/api/notes/${currentId}` : "/api/notes",
          {
            method: currentId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
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
        showToast();
        setMessage(manual ? "已保存" : "已自动保存");
        router.refresh();
      } finally {
        savingRef.current = false;
      }
    },
    [buildPayload, showToast, noteId, router],
  );

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    setHasEdited(true);
    setSaveState("dirty");
  }, [title, content, tagsInput, projectName]);

  useEffect(() => {
    cancelAutoSaveTimer();
    if (!autoSaveEnabled || !hasEdited || saveState !== "dirty" || isComposingRef.current) return;
    autoSaveTimerRef.current = setTimeout(() => {
      if (isComposingRef.current) return;
      void saveDraft(false);
    }, 2600);
    return () => cancelAutoSaveTimer();
  }, [autoSaveEnabled, hasEdited, saveState, saveDraft]);

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
    setMessage(next ? "已开启自动保存" : "已关闭自动保存，当前仅手动保存。");
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
    cancelAutoSaveTimer();
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
    if (autoSaveEnabled && hasEdited && saveState === "dirty") {
      cancelAutoSaveTimer();
      autoSaveTimerRef.current = setTimeout(() => { void saveDraft(false); }, 2600);
    }
  };

  const handleImported = ({
    content: importedContent,
    noteId: importedNoteId,
    mode,
  }: {
    content?: string;
    noteId?: string;
    mode: string;
  }) => {
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
    setContent((value) => `${value}${text}`);
    setSummary((state) => ({ ...state, status: "ready" }));
  };

  return (
    <div className="relative mx-auto w-full max-w-[760px]">
      {/* Save Toast */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-overlay)] px-3 py-1.5 text-xs text-[var(--text-secondary)] backdrop-blur-2xl"
          >
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3" /> 已保存
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Summary Panel */}
      <AnimatePresence>
        {(summary.status === "ready" || summary.status === "inserting") && summary.text ? (
          <motion.section
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="mb-6 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-[var(--ai-accent)]">AI 总结</div>
                <h3 className="mt-1 text-sm font-medium text-[var(--text-primary)]">已生成笔记总结</h3>
              </div>
              <button
                type="button"
                onClick={() => void insertSummary()}
                disabled={summary.status === "inserting"}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] px-3 py-1.5 text-xs text-[var(--text-primary)] transition hover:bg-[var(--interactive-hover)] disabled:opacity-60"
              >
                <Sparkles className="h-3 w-3" />
                {summary.status === "inserting" ? "插入中" : "插入"}
              </button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">
              {summary.text}
            </p>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
              saveState === "saved" && "text-[var(--success)]",
              saveState === "saving" && "text-[var(--warning)]",
              saveState === "error" && "text-[var(--danger)]",
            )}
          >
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              saveState === "saved" && "bg-[var(--success)]",
              saveState === "saving" && "bg-[var(--warning)] animate-pulse",
              saveState === "error" && "bg-[var(--danger)]",
              saveState === "idle" && "bg-[var(--text-faint)]",
              saveState === "dirty" && "bg-[var(--text-faint)]",
            )} />
            {saveState === "saved" ? "已保存" : saveState === "saving" ? "保存中" : saveState === "error" ? "保存失败" : saveState === "dirty" ? "有更改" : ""}
          </span>
          {stats.chars > 0 && <span>{stats.chars} 字</span>}
        </div>

        <div className="flex items-center gap-1">
          {/* View mode toggle */}
          <div className="flex items-center rounded-md border border-[var(--border-default)] mr-2">
            <button
              onClick={() => setViewMode("write")}
              className={cn("p-1.5 transition-colors rounded-l-md", viewMode === "write" ? "bg-[var(--interactive-active)] text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]")}
              title="写作"
            >
              <PenLine size={14} />
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={cn("p-1.5 transition-colors hidden lg:block", viewMode === "split" ? "bg-[var(--interactive-active)] text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]")}
              title="分屏"
            >
              <Columns2 size={14} />
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={cn("p-1.5 transition-colors rounded-r-md", viewMode === "preview" ? "bg-[var(--interactive-active)] text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]")}
              title="预览"
            >
              <Eye size={14} />
            </button>
          </div>

          <Button variant="ghost" size="sm" loading={summary.status === "loading"} icon={summary.status !== "loading" ? <Wand2 size={14} /> : undefined} onClick={() => void requestSummary()}>
            总结
          </Button>

          <Button variant="secondary" size="sm" onClick={() => void saveDraft(true)}>
            保存
          </Button>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setShowMore(!showMore)}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--interactive-hover)] transition-colors"
            >
              <MoreHorizontal size={14} />
            </button>
            {showMore && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMore(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] py-1 shadow-[var(--shadow-md)]">
                  <button
                    onClick={() => { toggleAutoSave(); setShowMore(false); }}
                    className="w-full px-3 py-2 text-left text-xs text-[var(--text-secondary)] hover:bg-[var(--interactive-hover)] transition-colors"
                  >
                    自动保存：{autoSaveEnabled ? "开" : "关"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Editor body */}
      <div className={cn(viewMode === "split" ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_1px_minmax(280px,1fr)]" : "")}>
        <div className={cn(viewMode === "preview" && "hidden")}>
          {/* Title */}
          <input
            aria-label="笔记标题"
            value={title}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="输入标题"
            className="w-full bg-transparent text-[28px] font-semibold leading-tight tracking-[-0.04em] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)]"
          />

          {/* Metadata */}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              aria-label="所属项目"
              value={projectName}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="所属项目"
              className="h-9 w-full rounded-md bg-[var(--surface-1)] px-3 text-sm text-[var(--text-secondary)] outline-none ring-1 ring-[var(--border-default)] focus:ring-2 focus:ring-[var(--border-focus)] placeholder:text-[var(--text-placeholder)] transition-[box-shadow]"
            />
            <input
              aria-label="笔记标签"
              value={tagsInput}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="标签，空格分隔"
              className="h-9 w-full rounded-md bg-[var(--surface-1)] px-3 text-sm text-[var(--text-secondary)] outline-none ring-1 ring-[var(--border-default)] focus:ring-2 focus:ring-[var(--border-focus)] placeholder:text-[var(--text-placeholder)] transition-[box-shadow]"
            />
          </div>

          {/* Content */}
          <textarea
            aria-label="笔记内容"
            value={content}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onChange={(event) => setContent(event.target.value)}
            placeholder="开始写点什么……"
            className="mt-6 min-h-[60vh] w-full resize-none bg-transparent py-2 text-[16px] leading-[1.75] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)]"
          />
        </div>

        {/* Split divider */}
        {viewMode === "split" && (
          <div className="hidden lg:block w-px bg-[var(--border-subtle)]" />
        )}

        {/* Preview */}
        {viewMode !== "write" && (
          <div className={cn(viewMode === "preview" && "min-h-[60vh]")}>
            <div className="text-xs font-medium text-[var(--text-muted)] mb-3">预览</div>
            <MarkdownPreview content={content} />
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className="mt-5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-xs text-[var(--text-secondary)]">
          {message}
        </div>
      )}

      {/* Import/Export */}
      <div className="mt-8">
        <ImportExportPanel noteId={noteId || undefined} embedded onImported={handleImported} />
      </div>
    </div>
  );
}
