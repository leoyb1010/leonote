"use client";

import { useRef, useState } from "react";

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
  const [message, setMessage] = useState("可直接导入到当前笔记，也可启用 AI 总结 / 保留原文 / 自定义提示词。\n");
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
    if (exportAi) params.set("ai", "1");
    if (prompt.trim()) params.set("prompt", prompt.trim());
    const res = await fetch(`/api/export?${params.toString()}`);
    if (!res.ok) {
      setMessage("导出失败，请先登录后重试。\n");
      setLoading(false);
      return;
    }
    const blob = await res.blob();
    const filename = noteId ? `leonote-note-${noteId.slice(0, 6)}-${exportAi ? "ai" : "raw"}.md` : `leonote-export-${new Date().toISOString().slice(0, 10)}.${exportAi ? "md" : "json"}`;
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
    if (!res.ok) {
      setMessage(data.message || "导入失败");
      return;
    }
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

  return (
    <section className={`${embedded ? "bg-white shadow-[0_8px_24px_rgba(0,0,0,0.03)]" : "glass-panel animate-rise"} space-y-4 rounded-[24px] p-5`}>
      <div>
        <h2 className="text-base font-medium text-[#111]">导入 / 导出</h2>
        <p className="mt-2 text-sm leading-6 text-[#666]">{noteId ? "可直接把链接/文件导入当前笔记，或导出当前笔记。" : "导入后可直接进入新笔记继续编辑。"}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="粘贴网页链接、文档链接、资料链接" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm outline-none" />
        <button type="button" onClick={() => void handleImportLink()} disabled={loading} className="rounded-full bg-[#111] px-5 py-3 text-sm text-white">导入链接</button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-2 rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-[#444]"><input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} /> AI 辅助整理</label>
        <label className="flex items-center gap-2 rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-[#444]"><input type="checkbox" checked={keepOriginal} onChange={(e) => setKeepOriginal(e.target.checked)} /> 保留原文</label>
        <label className="space-y-2 text-sm text-[#555]">
          <span>导入方式</span>
          <select value={mode} onChange={(e) => setMode(e.target.value as "append" | "replace" | "standalone")} className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-3 outline-none">
            {noteId ? <><option value="append">追加到当前笔记</option><option value="replace">替换当前笔记</option></> : null}
            <option value="standalone">独立生成新笔记</option>
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-[#444]"><input type="checkbox" checked={exportAi} onChange={(e) => setExportAi(e.target.checked)} /> 导出 AI 总结版</label>
      </div>

      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="可选：例如‘整理成会议纪要’、‘导出成简短汇报稿’、‘保留关键知识点’" className="min-h-[96px] w-full rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm outline-none" />

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => void handleExport()} disabled={loading} className="rounded-full bg-[#111] px-4 py-2 text-sm text-white">{loading ? "处理中" : noteId ? "导出当前笔记" : "导出备份"}</button>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={loading} className="rounded-full bg-[#f3f2ef] px-4 py-2 text-sm text-[#333]">导入文件</button>
        <input ref={inputRef} type="file" accept="application/json,.json,text/plain,.txt,text/markdown,.md,text/html,.html" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleImportFile(file); }} />
      </div>

      <div className="rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-[#666] whitespace-pre-wrap">{message}</div>
    </section>
  );
}
