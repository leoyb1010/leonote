"use client";

import { Download, FileUp, Link2, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/base/Button";

type Props = {
  noteId?: string;
  embedded?: boolean;
  onImported?: (payload: { content?: string; noteId?: string; mode: string }) => void;
};

function downloadFromResponse(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportExportPanel({ noteId, embedded, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("可直接导入到当前笔记，也可启用 AI 总结 / 保留原文 / 自定义提示词。");
  const [loading, setLoading] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [keepOriginal, setKeepOriginal] = useState(true);
  const [exportAi, setExportAi] = useState(false);
  const [mode, setMode] = useState<"append" | "replace" | "standalone">(noteId ? "append" : "standalone");
  const [prompt, setPrompt] = useState("");

  const handleExport = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (noteId) params.set("noteId", noteId);
    if (prompt.trim()) params.set("prompt", prompt.trim());

    if (exportAi && noteId) {
      const res = await fetch(`/api/export?${params.toString()}`, { method: "POST" });
      if (!res.ok) {
        setMessage("导出失败，请先登录后重试。");
        setLoading(false);
        return;
      }
      const blob = await res.blob();
      downloadFromResponse(blob, `leonote-note-${noteId.slice(0, 6)}-ai.md`);
      setMessage("已导出 AI 整理版。");
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/export?${params.toString()}`);
    if (!res.ok) {
      setMessage("导出失败，请先登录后重试。");
      setLoading(false);
      return;
    }
    const blob = await res.blob();
    const filename = noteId ? `leonote-note-${noteId.slice(0, 6)}-raw.md` : `leonote-export-${new Date().toISOString().slice(0, 10)}.json`;
    downloadFromResponse(blob, filename);
    setMessage(exportAi ? "已导出 AI 整理版。" : "已导出原始内容。");
    setLoading(false);
  };

  const submitImport = async (form: FormData) => {
    form.append("aiEnabled", aiEnabled ? "1" : "0");
    form.append("keepOriginal", keepOriginal ? "1" : "0");
    form.append("mode", mode);
    if (prompt.trim()) form.append("prompt", prompt.trim());
    if (noteId) form.append("noteId", noteId);
    const res = await fetch("/api/import", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setMessage(data.message || "导入失败"); return; }
    setMessage(data.message || "导入成功");
    if (onImported) onImported({ content: data.content, noteId: data.note?.id || data.noteId, mode });
    if (!noteId) {
      window.location.href = data.note?.id ? `/notes/${data.note.id}` : data.noteId ? `/notes/${data.noteId}` : "/notes";
    }
  };

  const handleImportFile = async (file: File) => {
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    await submitImport(form);
  };

  const handleImportLink = async () => {
    if (!link.trim()) return setMessage("请先输入要导入的链接");
    setLoading(true);
    const form = new FormData();
    form.append("link", link.trim());
    await submitImport(form);
  };

  const content = (
    <div className="space-y-4 p-5">
      <div>
        <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Import / Export</div>
        <h2 className="mt-2 text-base font-medium text-[var(--text-primary)]">导入 / 导出</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{noteId ? "可直接把链接/文件导入当前笔记，或导出当前笔记。" : "导入后可直接进入新笔记继续编辑。"}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-4">
          <Link2 className="h-4 w-4 text-[var(--ai-accent)] shrink-0" />
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="粘贴网页链接、文档链接、资料链接" className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)]" />
        </div>
        <Button size="lg" className="shrink-0" onClick={() => void handleImportLink()} loading={loading}>导入链接</Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--interactive-active)] h-10 px-4 text-sm text-[var(--text-secondary)] cursor-pointer">
          <input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} />
          <Sparkles className="h-4 w-4 text-[var(--ai-accent)]" />AI 辅助整理
        </label>
        <label className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--interactive-active)] h-10 px-4 text-sm text-[var(--text-secondary)] cursor-pointer">
          <input type="checkbox" checked={keepOriginal} onChange={(e) => setKeepOriginal(e.target.checked)} /> 保留原文
        </label>
        <label className="space-y-2 text-sm text-[var(--text-secondary)]">
          <span>导入方式</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as "append" | "replace" | "standalone")} className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-base)] h-10 px-4 text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)]">
            {noteId ? <><option value="append">追加到当前笔记</option><option value="replace">替换当前笔记</option></> : null}
            <option value="standalone">独立生成新笔记</option>
          </select>
        </label>
        <label className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--interactive-active)] h-10 px-4 text-sm text-[var(--text-secondary)] cursor-pointer">
          <input type="checkbox" checked={exportAi} onChange={(e) => setExportAi(e.target.checked)} /> 导出 AI 总结版
        </label>
      </div>

      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="可选：例如「整理成会议纪要」、「导出成简短汇报稿」、「保留关键知识点」" className="min-h-[96px] w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)] focus:border-[var(--border-focus)] resize-none" />

      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={() => void handleExport()} loading={loading} icon={<Download className="h-4 w-4" />}>{loading ? "处理中" : noteId ? "导出当前笔记" : "导出备份"}</Button>
        <Button variant="secondary" size="lg" onClick={() => inputRef.current?.click()} loading={loading} icon={<FileUp className="h-4 w-4" />}>导入文件</Button>
        <input ref={inputRef} type="file" accept="application/json,.json,text/plain,.txt,text/markdown,.md,text/html,.html" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleImportFile(file); }} />
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--interactive-active)] px-4 py-2.5 text-sm whitespace-pre-wrap text-[var(--text-muted)]">{message}</div>
    </div>
  );

  if (embedded) {
    return <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-glass)]">{content}</div>;
  }

  return <GlassPanel blur="xl" className="rounded-[var(--radius-lg)]">{content}</GlassPanel>;
}
