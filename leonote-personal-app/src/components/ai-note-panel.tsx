"use client";

import { AIChatPanel } from "@/components/ai/AIChatPanel";

export function AINotePanel({ noteId }: { noteId: string }) {
  return (
    <details className="group rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[rgba(8,11,18,0.34)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm text-[var(--text-muted)] transition hover:text-white">
        <span>AI 辅助</span>
        <span className="text-xs text-[var(--text-muted)] group-open:hidden">展开</span>
        <span className="hidden text-xs text-[var(--text-muted)] group-open:inline">收起</span>
      </summary>
      <div className="border-t border-[var(--border-default)] p-3">
        <AIChatPanel noteId={noteId} />
      </div>
    </details>
  );
}
