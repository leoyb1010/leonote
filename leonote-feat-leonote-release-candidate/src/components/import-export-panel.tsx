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
  const [message, setMessage] = useState("支持导入 JSON / Markdown / TXT，并基于服务器真实数据导出。");
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
    if (data.note?.id) {
      window.location.href = `/notes/${data.note.id}`;
      return;
    }
    if (data.noteId) {
      window.location.href = `/notes/${data.noteId}`;
      return;
    }
    window.location.href = "/notes";
  };

  return (
    <section className="space-y-4 rounded-[24px] bg-white p-5">
      <div>
        <h2 className="text-base font-medium text-[#111]">导入 / 导出</h2>
        <p className="mt-2 text-sm leading-6 text-[#666]">导入后直接落库，导出来自当前账号的服务器真实数据。</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => void handleExport()} disabled={loading} className="rounded-full bg-[#111] px-4 py-2 text-sm text-white transition-all duration-200 hover:-translate-y-[1px] active:scale-[0.98]">{loading ? "处理中" : "导出备份"}</button>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={loading} className="rounded-full bg-[#f3f2ef] px-4 py-2 text-sm text-[#333] transition-all duration-200 hover:bg-[#ebe8e1] active:scale-[0.98]">导入文件</button>
        <input ref={inputRef} type="file" accept="application/json,.json,text/plain,.txt,text/markdown,.md" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) void handleImportFile(file); }} />
      </div>

      <div className="rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-[#666]">{message}</div>
    </section>
  );
}
