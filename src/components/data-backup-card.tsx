import { Database, FileArchive } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";

export function DataBackupCard() {
  return (
    <GlassPanel blur="lg" glow="soft" className="rounded-[var(--radius-lg)] p-5">
      <h2 className="inline-flex items-center gap-2 text-base font-medium text-[var(--text-primary)]">
        <Database className="h-4 w-4 text-[var(--ai-accent)]" />
        数据与备份
      </h2>
      <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
        当前版本采用 Leonote 自己的数据存储，不直接依赖 Apple 备忘录做同步主链。
      </p>
      <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
        原因很简单：Apple 备忘录缺少稳定公开同步接口，直接同步长期看不稳。
      </p>
      <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">更合理的方向是：</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--text-muted)]">
        <li>Leonote 自己做主存储</li>
        <li>支持导入 Markdown / TXT / 导出备份</li>
        <li>后续可做 Apple 备忘录迁移工具，而不是强绑定同步</li>
      </ul>
      <div className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-3 py-2 text-xs text-[var(--text-muted)]">
        <FileArchive className="h-3.5 w-3.5" />
        当前备份策略：导出优先，迁移次之，同步后置
      </div>
    </GlassPanel>
  );
}
