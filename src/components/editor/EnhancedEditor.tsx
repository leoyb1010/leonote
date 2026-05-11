"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  Columns2,
  Eye,
  FileUp,
  Focus,
  Image as ImageIcon,
  MoreHorizontal,
  Paperclip,
  PenLine,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
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
  attachments?: AttachmentShape[];
};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
type ViewMode = "write" | "preview" | "split";
type SaveOptions = {
  manual?: boolean;
  closeAfterSave?: boolean;
  navigateAfterCreate?: boolean;
  contentOverride?: string;
  targetNoteId?: string;
};

type SummaryState = {
  status: "idle" | "loading" | "ready" | "inserting" | "error";
  text: string;
};

type ProjectOption = { id: string; name: string };

type AttachmentShape = {
  id: string;
  noteId: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
};

const AUTOSAVE_KEY = "leonote.autosave.enabled";

// v1.4: quiet save messages
const saveMessages = { manual: "已安静保存。", auto: "正在安放…" };

export function EnhancedEditor({ initialNote }: { initialNote?: NoteShape }) {
  const router = useRouter();
  const [noteId, setNoteId] = useState(initialNote?.id ?? "");
  const [title, setTitle] = useState(initialNote?.title ?? "");
  const [content, setContent] = useState(initialNote?.content ?? "");
  const [tagsInput, setTagsInput] = useState((initialNote?.tags ?? []).join(" "));
  const [projectId, setProjectId] = useState(initialNote?.project?.id ?? "");
  const [newProjectName, setNewProjectName] = useState("");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [attachments, setAttachments] = useState<AttachmentShape[]>(initialNote?.attachments ?? []);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [hasEdited, setHasEdited] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("write");
  const [showMore, setShowMore] = useState(false);
  const [summary, setSummary] = useState<SummaryState>({ status: "idle", text: "" });
  const [saveToast, setSaveToast] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(AUTOSAVE_KEY) === "1";
  });

  const initialized = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const isComposingRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

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
    (contentOverride?: string) => ({
      title: title || "未命名笔记",
      content: contentOverride ?? content,
      excerpt: (contentOverride ?? content).slice(0, 120) || "暂无摘要",
      tags: tagsInput
        .split(/[\s,，]+/)
        .map((item) => item.trim())
        .filter(Boolean),
      projectId: newProjectName.trim() ? undefined : projectId || null,
      projectName: newProjectName.trim() || undefined,
    }),
    [title, content, tagsInput, projectId, newProjectName],
  );

  const showToast = useCallback(() => {
    setSaveToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setSaveToast(false), 1600);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/projects", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setProjects((data.projects || []).map((item: { id: string; name: string }) => ({ id: item.id, name: item.name })));
      })
      .catch(() => {
        if (active) setProjects([]);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!noteId) return;
    let active = true;
    fetch(`/api/notes/${noteId}/attachments`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setAttachments(data.attachments || []);
      })
      .catch(() => {
        if (active) setAttachments([]);
      });
    return () => { active = false; };
  }, [noteId]);

  const saveDraft = useCallback(
    async ({
      manual = false,
      closeAfterSave = false,
      navigateAfterCreate = true,
      contentOverride,
      targetNoteId,
    }: SaveOptions = {}) => {
      cancelAutoSaveTimer();
      if (savingRef.current) return targetNoteId || noteId || null;
      savingRef.current = true;
      setSaveState("saving");
      setMessage("");
      const payload = buildPayload(contentOverride);
      const currentId = targetNoteId ?? noteId;
      try {
        const res = await fetch(
          currentId ? `/api/notes/${currentId}` : "/api/notes",
          {
            method: currentId ? "PATCH" : "POST",
            headers: {
              "Content-Type": "application/json",
              "x-leonote-save-reason": manual ? "manual" : "auto",
            },
            body: JSON.stringify(payload),
          },
        );
        const data = await res.json();
        if (!res.ok) {
          setSaveState("error");
          setMessage(data.message || "这次没有保存成功，请先复制内容");
          return null;
        }
        const id = data.note.id as string;
        if (!currentId) setNoteId(id);
        setSaveState("saved");
        showToast();
        setMessage(manual ? saveMessages.manual : saveMessages.auto);
        router.refresh();
        if (closeAfterSave) {
          router.push("/notes");
          return id;
        }
        if (!currentId && navigateAfterCreate) router.replace(`/notes/${id}`);
        return id;
      } catch {
        setSaveState("error");
        setMessage("网络异常，这次没有保存成功，请先复制内容。");
        return null;
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
  }, [title, content, tagsInput, projectId, newProjectName]);

  useEffect(() => {
    cancelAutoSaveTimer();
    if (!autoSaveEnabled || !hasEdited || saveState !== "dirty" || isComposingRef.current) return;
    autoSaveTimerRef.current = setTimeout(() => {
      if (isComposingRef.current) return;
      void saveDraft();
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
        void saveDraft({ manual: true });
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
      autoSaveTimerRef.current = setTimeout(() => { void saveDraft(); }, 2600);
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
    const text = `\n\n## AI 整理\n${summary.text}\n`;
    setContent((value) => `${value}${text}`);
    setSummary((state) => ({ ...state, status: "ready" }));
  };

  const buildAttachmentMarkdown = (attachment: AttachmentShape) => {
    const label = attachment.filename.replace(/[\]\[]/g, "");
    if (attachment.mimeType.startsWith("image/")) {
      return `![${label}](${attachment.url})`;
    }
    return `[${label}](${attachment.url})`;
  };

  const uploadFiles = async (files: File[]) => {
    const selected = files.filter((file) => file.size > 0);
    if (selected.length === 0) return;

    setUploading(true);
    setUploadMessage("正在保存笔记并上传附件…");
    const savedId = noteId || await saveDraft({ manual: true, navigateAfterCreate: false });
    if (!savedId) {
      setUploading(false);
      setUploadMessage("请先保存笔记，再添加附件。");
      return;
    }

    const uploaded: AttachmentShape[] = [];
    for (const file of selected) {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/notes/${savedId}/attachments`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({ message: "" }));
      if (!res.ok) {
        setUploadMessage(data.message || `上传失败：${file.name}`);
        setUploading(false);
        return;
      }
      uploaded.push(data.attachment);
    }

    setAttachments((current) => [...current, ...uploaded]);
    const snippet = uploaded.map(buildAttachmentMarkdown).join("\n\n");
    const nextContent = content ? `${content}\n\n${snippet}` : snippet;
    setContent(nextContent);
    await saveDraft({ targetNoteId: savedId, contentOverride: nextContent, navigateAfterCreate: false });
    setUploadMessage(`已添加 ${uploaded.length} 个附件。`);
    setUploading(false);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files || []);
    if (files.length === 0) return;
    event.preventDefault();
    void uploadFiles(files);
  };

  const handleDrop = (event: React.DragEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.dataTransfer.files || []);
    if (files.length === 0) return;
    event.preventDefault();
    void uploadFiles(files);
  };

  const removeAttachment = async (attachment: AttachmentShape) => {
    const res = await fetch(`/api/notes/${attachment.noteId}/attachments/${attachment.id}`, { method: "DELETE" });
    if (!res.ok) {
      setUploadMessage("删除附件失败。");
      return;
    }
    setAttachments((current) => current.filter((item) => item.id !== attachment.id));
    setUploadMessage("附件已删除，正文中的引用可按需手动移除。");
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div
      className={cn(
        "relative mx-auto w-full min-w-0 transition-all duration-[var(--duration-slow)]",
        focusMode ? "max-w-[820px]" : "max-w-[760px]",
      )}
    >
      {/* v1.4 Save Toast */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-full border border-[var(--hairline)] bg-[var(--material-elevated)] px-4 py-1.5 text-xs text-[var(--text-secondary)] shadow-[var(--shadow-sm)]"
          >
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3 w-3 text-[var(--success)]" /> 已安静保存
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* v1.4 AI Summary Panel */}
      <AnimatePresence>
        {(summary.status === "ready" || summary.status === "inserting") && summary.text ? (
          <motion.section
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="mb-6 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-5 shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-[var(--ai-accent)]">静读</div>
                <h3 className="mt-1 text-sm font-medium text-[var(--text-primary)]">我整理出了一版脉络。</h3>
              </div>
              <button
                type="button"
                onClick={() => void insertSummary()}
                disabled={summary.status === "inserting"}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] px-3 py-1.5 text-xs text-[var(--text-primary)] transition hover:bg-[var(--interactive-hover)] disabled:opacity-60"
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

      {/* v1.4 Toolbar */}
      <div className="mb-6 flex flex-col items-start justify-between gap-3 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center">
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
            {saveState === "saved" ? "已安静保存" : saveState === "saving" ? "正在安放…" : saveState === "error" ? "未保存" : saveState === "dirty" ? "有更改" : ""}
          </span>
          {stats.chars > 0 && <span>{stats.chars} 字</span>}
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-1 sm:w-auto">
          {/* Focus Mode toggle */}
          <button
            onClick={() => setFocusMode(!focusMode)}
            className={cn(
              "p-1.5 rounded-md transition-colors mr-1",
              focusMode
                ? "bg-[var(--interactive-active)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--interactive-hover)]"
            )}
            title={focusMode ? "退出安静写作" : "安静写作"}
          >
            <Focus size={14} />
          </button>

          {/* View mode toggle */}
          <div className="flex items-center rounded-md border border-[var(--hairline)] mr-2">
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
            <span className="hidden 2xl:inline">提炼要点</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            loading={saveState === "saving"}
            onClick={() => void saveDraft({ manual: true, closeAfterSave: true })}
          >
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
                <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-[var(--hairline)] bg-[var(--material-elevated)] py-1 shadow-[var(--shadow-md)]">
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

      {/* v1.4 Editor body */}
      <motion.div
        layout
        transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
        className={cn(viewMode === "split" ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_1px_minmax(280px,1fr)]" : "")}
      >
        <div className={cn(viewMode === "preview" && "hidden")}>
          {/* Title */}
          <input
            aria-label="笔记标题"
            value={title}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="输入标题"
            className="w-full bg-transparent text-2xl font-semibold leading-tight tracking-[-0.04em] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)] sm:text-[28px]"
          />

          {/* Metadata */}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <select
                aria-label="选择已有项目"
                value={newProjectName.trim() ? "" : projectId}
                onChange={(event) => {
                  setProjectId(event.target.value);
                  if (event.target.value) setNewProjectName("");
                }}
                className="h-9 w-full rounded-md bg-[var(--material-inset)] px-3 text-sm text-[var(--text-secondary)] outline-none ring-1 ring-[var(--hairline)] focus:ring-2 focus:ring-[var(--border-focus)] transition-[box-shadow]"
              >
                <option value="">无项目</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
              <input
                aria-label="新项目名称"
                value={newProjectName}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onChange={(event) => {
                  setNewProjectName(event.target.value);
                  if (event.target.value.trim()) setProjectId("");
                }}
                placeholder="新项目名称"
                className="h-9 w-full rounded-md bg-[var(--material-inset)] px-3 text-sm text-[var(--text-secondary)] outline-none ring-1 ring-[var(--hairline)] focus:ring-2 focus:ring-[var(--border-focus)] placeholder:text-[var(--text-placeholder)] transition-[box-shadow]"
              />
            </div>
            <input
              aria-label="笔记标签"
              value={tagsInput}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder="标签，空格分隔"
              className="h-9 w-full rounded-md bg-[var(--material-inset)] px-3 text-sm text-[var(--text-secondary)] outline-none ring-1 ring-[var(--hairline)] focus:ring-2 focus:ring-[var(--border-focus)] placeholder:text-[var(--text-placeholder)] transition-[box-shadow]"
            />
          </div>

          {/* Content textarea */}
          <textarea
            aria-label="笔记内容"
            value={content}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            onChange={(event) => setContent(event.target.value)}
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
            placeholder="开始写点什么……"
            className="leonote-editor-textarea mt-6 min-h-[60vh] w-full resize-none bg-transparent py-2 outline-none placeholder:text-[var(--text-placeholder)]"
          />

          <div className="mt-3 rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--material-inset)] px-3 py-3 text-xs text-[var(--text-muted)]">
            <div className="flex flex-wrap items-center gap-2">
              <Paperclip className="h-3.5 w-3.5" />
              <span>可直接粘贴图片/文件，或拖到正文区域。</span>
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                disabled={uploading}
                className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline)] px-2 py-1 text-[var(--text-secondary)] transition hover:bg-[var(--interactive-hover)] disabled:opacity-50"
              >
                <FileUp className="h-3.5 w-3.5" />
                选择附件
              </button>
              <input
                ref={attachmentInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  event.target.value = "";
                  void uploadFiles(files);
                }}
              />
            </div>
            {uploadMessage ? <div className="mt-2 text-[var(--text-secondary)]">{uploadMessage}</div> : null}
            {attachments.length > 0 ? (
              <div className="mt-3 grid gap-2">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex min-w-0 items-center gap-2 rounded-md border border-[var(--hairline)] bg-[var(--surface-base)] px-2.5 py-2">
                    {attachment.mimeType.startsWith("image/") ? <ImageIcon className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" /> : <Paperclip className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />}
                    <a href={attachment.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                      {attachment.filename}
                    </a>
                    <span className="shrink-0 text-[var(--text-faint)]">{formatFileSize(attachment.size)}</span>
                    <button
                      type="button"
                      onClick={() => void removeAttachment(attachment)}
                      className="shrink-0 rounded-md p-1 text-[var(--text-muted)] transition hover:bg-[var(--interactive-hover)] hover:text-[var(--danger)]"
                      aria-label={`删除附件 ${attachment.filename}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Split divider */}
        {viewMode === "split" && (
          <div className="hidden lg:block w-px bg-[var(--hairline)]" />
        )}

        {/* Preview */}
        {viewMode !== "write" && (
          <div className={cn(viewMode === "preview" && "min-h-[60vh]")}>
            <div className="text-xs font-medium text-[var(--text-muted)] mb-3">预览</div>
            <MarkdownPreview content={content} />
          </div>
        )}
      </motion.div>

      {/* Message */}
      {message && (
        <div className="mt-5 rounded-lg border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-2 text-xs text-[var(--text-secondary)]">
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
