"use client";

import { useRef, useState } from "react";

function downloadFromResponse(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportExportPanel() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("支持导入 JSON / Markdown / TXT / HTML / DOCX / PDF，也支持新闻链接导入。");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    const res = await fetch("/api/export");
    if (!res.ok) {
      setMessage("导出失败，请先登录后重试。");
      setLoading(false);
      return;
    }

    const blob = await res.blob();
    const filename = `leonote-export-${new Date().toISOString().slice(0, 10)}.json`;
    downloadFromResponse(blob, filename);
    setMessage("导出成功，已下载当前账号的真实数据备份。");
    setLoading(false);
  };

  const handleImportFile = async (file: File) => {
    setLoading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/import", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.message || "导入失败");
      return;
    }

    setMessage(data.count ? `导入成功，已写入 ${data.count} 条笔记。` : "导入成功，正在进入笔记详情。");
    window.location.href = data.note?.id ? `/notes/${data.note.id}` : data.noteId ? `/notes/${data.noteId}` : "/notes";
  };

  const handleImportLink = async () => {
    if (!link.trim()) {
      setMessage("请先输入要导入的链接");
      return;
    }
    setLoading(true);
    const form = new FormData();
    form.append("link", link.trim());
    const res = await fetch("/api/import", { method: "POST", body: form });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.message || "链接导入失败");
      return;
    }
    setMessage("链接已采集为笔记，正在进入详情页。");
    window.location.href = `/notes/${data.note.id}`;
  };

  return (
    <section className="glass-panel animate-rise space-y-4 rounded-[24px] p-5">
      <div>
        <h2 className="text-base font-medium text-[#111]">导入 / 导出</h2>
        <p className="mt-2 text-sm leading-6 text-[#666]">导入后直接落库，导出来自当前账号的服务器真实数据。</p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="粘贴新闻链接、网页链接或资料链接" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm outline-none transition-all duration-300 focus:-translate-y-[1px] focus:bg-white focus:shadow-[0_16px_40px_rgba(0,0,0,0.06)]" />
        <button type="button" onClick={() => void handleImportLink()} disabled={loading} className="rounded-full bg-[#111] px-5 py-3 text-sm text-white transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(17,17,17,0.24)] active:scale-[0.98]">导入链接</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => void handleExport()} disabled={loading} className="rounded-full bg-[#111] px-4 py-2 text-sm text-white transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(17,17,17,0.24)] active:scale-[0.98]">{loading ? "处理中" : "导出备份"}</button>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={loading} className="rounded-full bg-[#f3f2ef] px-4 py-2 text-sm text-[#333] transition-all duration-300 hover:-translate-y-[1px] hover:bg-[#ebe8e1] active:scale-[0.98]">导入文件</button>
        <input ref={inputRef} type="file" accept="application/json,.json,text/plain,.txt,text/markdown,.md,text/html,.html,.docx,.pdf" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleImportFile(file); }} />
      </div>

      <div className="rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-[#666]">{message}</div>
    </section>
  );
}
