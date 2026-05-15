"use client";

import { BrainCircuit, ChevronRight } from "lucide-react";
import type { BriefingThinkingInsight } from "@/lib/briefing/types";

type DetailAnchor = { top: number; left: number; width: number; height: number; x?: number; y?: number };

interface Props {
  insights: BriefingThinkingInsight[];
  onOpen: (insight: BriefingThinkingInsight, anchor: DetailAnchor) => void;
}

const THINKING_LABELS = ["一", "二", "三", "四", "五", "六", "七"];

export function ThinkingPanel({ insights, onOpen }: Props) {
  return (
    <section className="card-premium p-4 lg:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] uppercase text-[var(--text-muted)]">
            <BrainCircuit size={13} />
            继续思考
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">今天值得继续想</h2>
        </div>
        <span className="rounded-[var(--radius-pill)] bg-[var(--primary-soft)] px-2.5 py-1 text-[11px] text-[var(--primary)]">
          {insights.length} 条
        </span>
      </div>

      {insights.length === 0 ? (
        <div className="quiet-inset rounded-[var(--radius-lg)] px-3 py-6 text-sm leading-6 text-[var(--text-muted)]">
          正在等待足够有推演价值的事件。
        </div>
      ) : (
        <div className="space-y-2.5">
          {insights.slice(0, 7).map((insight, index) => (
            <button
              key={insight.id}
              type="button"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                onOpen(insight, { top: rect.top, left: rect.left, width: rect.width, height: rect.height, x: event.clientX, y: event.clientY });
              }}
              className="group w-full rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-3 text-left transition hover:border-[var(--hairline-strong)] hover:bg-[var(--material-muted)]"
            >
              <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                <span>思考{THINKING_LABELS[index] ?? index + 1}</span>
                <span>{insight.impactLabel}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-medium leading-5 text-[var(--text-primary)] group-hover:text-[var(--primary)]">
                {insight.title}
              </p>
              <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">
                {insight.question}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {insight.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="rounded-[var(--radius-pill)] border border-[var(--hairline)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                      {tag}
                    </span>
                  ))}
                </div>
                <ChevronRight size={14} className="shrink-0 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--text-primary)]" />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
