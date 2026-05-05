"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Wand2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { summarizeExpand } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { ImportExportPanel } from "@/components/import-export-panel";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { SaveStatusIndicator } from "@/components/base/SaveStatusIndicator";
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
  const [tagsInput, setTagsInput] = useState(
    (initialNote?.tags ?? []).join(" "),
  );
  const [projectName, setProjectName] = useState(
    initialNote?.project?.name ?? "",
  );
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [hasEdited, setHasEdited] = useState(false);
  const [summary, setSummary] = useState<SummaryState>({
    status: "idle",
    text: "",
  });
  const [saveBurst, setSaveBurst] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(AUTOSAVE_KEY) !== "0";
  });

  const initialized = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const isComposingRef = useRef(false);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  const isNewNote = !noteId;
  const stats = useMemo(() => {
    const length = content.trim().length;
    return {
      words: length === 0 ? 0 : content.trim().split(/\s+/).length,
      chars: length,
    };
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

  const emitSavedBurst = useCallback(() => {
    const target = contentRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    setSaveBurst({
      visible: true,
      x: rect.left + Math.min(rect.width - 96, rect.width * 0.7),
      y: rect.top + 28,
    });
    window.setTimeout(
      () => setSaveBurst((state) => ({ ...state, visible: false })),
      1300,
    );
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
        emitSavedBurst();
        setMessage(manual ? "已保存" : "已自动保存");
        router.refresh();
      } finally {
        savingRef.current = false;
      }
    },
    [buildPayload, emitSavedBurst, noteId, router],
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
    if (
      !autoSaveEnabled ||
      !hasEdited ||
      saveState !== "dirty" ||
      isComposingRef.current
    )
      return;
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
    setMessage(
      next ? "已开启自动保存" : "已关闭自动保存，当前仅手动保存。",
    );
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
    cancelAutoSaveTimer();
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
    if (autoSaveEnabled && hasEdited && saveState === "dirty") {
      cancelAutoSaveTimer();
      autoSaveTimerRef.current = setTimeout(() => {
        void saveDraft(false);
      }, 2600);
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
      setMessage(
        mode === "replace"
          ? "已用导入内容替换当前笔记。"
          : "已把导入内容追加到当前笔记。",
      );
    }
  };

  const requestSummary = async () => {
    if (!noteId) {
      setMessage("请先保存笔记，再生成总结。");
      return;
    }
    setSummary({ status: "loading", text: "" });
    const res = await fetch(`/api/ai/notes/${noteId}/summarize`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({ summary: "" }));
    if (!res.ok) {
      setSummary({ status: "error", text: "" });
      setMessage(data.message || "总结失败");
      return;
    }
    setSummary({
      status: "ready",
      text: data.summary || "已生成摘要，但内容为空。",
    });
  };

  const insertSummary = async () => {
    if (!summary.text.trim()) return;
    setSummary((state) => ({ ...state, status: "inserting" }));
    const text = `\n\n## AI 总结\n${summary.text}\n`;
    setContent((value) => `${value}${text}`);
    setSummary((state) => ({ ...state, status: "ready" }));
  };

  return (
    <div className="relative space-y-5">
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
        {(summary.status === "ready" || summary.status === "inserting") &&
        summary.text ? (
          <motion.section
            layout
            variants={summarizeExpand}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <GlassPanel
              blur="xl"
              glow="brand"
              className="rounded-[var(--radius-lg)] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold text-[var(--ai-accent)]">
                    AI Summary
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                    已生成笔记总结
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => void insertSummary()}
                  disabled={summary.status === "inserting"}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.08)] px-4 py-2 text-sm text-[var(--text-primary)] transition hover:bg-white/12 disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4" />
                  {summary.status === "inserting" ? "插入中" : "一键插入"}
                </button>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">
                {summary.text}
              </p>
            </GlassPanel>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <GlassPanel
        blur="xl"
        glow="brand"
        hoverGlow
        className="rounded-[var(--radius-lg)] p-5"
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
          <div className="inline-flex items-center gap-3">
            <SaveStatusIndicator
              status={
                saveState === "saved"
                  ? "saved"
                  : saveState === "saving"
                    ? "saving"
                    : saveState === "error"
                      ? "offline"
                      : "idle"
              }
            />
            <span className="text-xs text-[var(--text-muted)]">
              {stats.words} 词 · {stats.chars} 字符
            </span>
          </div>
          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAutoSave}
              className={cn(
                "rounded-[var(--radius-md)] px-3 py-1.5 text-xs transition-colors",
                autoSaveEnabled
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--primary-soft)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              )}
            >
              自动保存：{autoSaveEnabled ? "开" : "关"}
            </button>
            <Button
              variant="primary"
              size="sm"
              loading={summary.status === "loading"}
              icon={
                summary.status !== "loading" ? (
                  <Wand2 size={14} />
                ) : undefined
              }
              onClick={() => void requestSummary()}
            >
              总结
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void saveDraft(true)}
            >
              手动保存
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_1px_minmax(280px,1fr)] lg:gap-0">
          <div className="space-y-4 lg:pr-5">
            <input
              aria-label="笔记标题"
              value={title}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="输入标题"
              className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-3 text-lg font-semibold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--border-focus)] placeholder:text-[var(--text-placeholder)]"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <input
                aria-label="所属项目"
                value={projectName}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="所属项目，例如 Leonote"
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-3 text-sm text-[var(--text-secondary)] outline-none transition-colors focus:border-[var(--border-focus)] placeholder:text-[var(--text-placeholder)]"
              />
              <input
                aria-label="笔记标签"
                value={tagsInput}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="标签，空格分隔"
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-3 text-sm text-[var(--text-secondary)] outline-none transition-colors focus:border-[var(--border-focus)] placeholder:text-[var(--text-placeholder)]"
              />
            </div>
            <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-base)]">
              <textarea
                ref={contentRef}
                aria-label="笔记内容"
                value={content}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onChange={(event) => setContent(event.target.value)}
                placeholder="开始记录内容……"
                className="min-h-[420px] w-full resize-none bg-transparent px-4 py-4 text-sm leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)]"
              />
            </div>
          </div>

          <div className="hidden lg:block w-px bg-[var(--border-subtle)]" />

          <div className="space-y-4 lg:pl-5">
            <GlassPanel
              blur="lg"
              glow="soft"
              className="rounded-[var(--radius-lg)] p-4"
            >
              <div className="text-xs font-semibold text-[var(--text-secondary)] mb-3">
                预览
              </div>
              <MarkdownPreview content={content} />
            </GlassPanel>
            <GlassPanel
              blur="lg"
              glow="soft"
              className="rounded-[var(--radius-lg)] p-4"
            >
              <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                <span>状态</span>
                <span>{isNewNote ? "草稿" : "已保存笔记"}</span>
              </div>
              <div className="mt-3 space-y-3 text-sm text-[var(--text-muted)] leading-relaxed">
                <p>
                  {isNewNote
                    ? "输入内容后会自动创建笔记。"
                    : autoSaveEnabled
                      ? "停止输入约 2.6 秒后自动保存。"
                      : "当前为手动保存模式。"}
                </p>
                {message && (
                  <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--primary-soft)] px-3 py-3 text-[var(--text-secondary)]">
                    {message}
                  </div>
                )}
              </div>
            </GlassPanel>
          </div>
        </div>
      </GlassPanel>

      <ImportExportPanel
        noteId={noteId || undefined}
        embedded
        onImported={handleImported}
      />
    </div>
  );
}
