import { Database, Download } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";

export function DataBackupCard() {
  const handleExport = async () => {
    const res = await fetch("/api/export");
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leonote-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <GlassPanel
      blur="lg"
     
      className="rounded-[var(--radius-lg)] p-5"
    >
      <h2 className="inline-flex items-center gap-2 text-base font-medium text-[var(--text-primary)]">
        <Database className="h-4 w-4 text-[var(--ai-accent)]" />
        数据与备份
      </h2>
      <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        你的全部笔记数据属于你。建议定期导出备份。
      </p>
      <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">
        数据库文件路径：<code className="text-xs bg-[var(--surface-raised)] px-1.5 py-0.5 rounded">./data/leonote.db</code>
      </p>
      <button
        type="button"
        onClick={() => void handleExport()}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--primary-hover)]"
      >
        <Download className="h-4 w-4" />
        导出全部笔记 (JSON)
      </button>
    </GlassPanel>
  );
}
