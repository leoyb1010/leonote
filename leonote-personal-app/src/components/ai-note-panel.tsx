"use client";

import { AIChatPanel } from "@/components/ai/AIChatPanel";

export function AINotePanel({ noteId }: { noteId: string }) {
  return (
    <details className="group rounded-[18px] border border-white/8 bg-[rgba(8,11,18,0.34)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm text-white/64 transition hover:text-white">
        <span>AI 辅助</span>
        <span className="text-xs text-white/36 group-open:hidden">展开</span>
        <span className="hidden text-xs text-white/36 group-open:inline">收起</span>
      </summary>
      <div className="border-t border-white/8 p-3">
        <AIChatPanel noteId={noteId} />
      </div>
    </details>
  );
}
