"use client";

import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { BrainCircuit, X } from "lucide-react";
import type { BriefingThinkingInsight } from "@/lib/briefing/types";

type DetailAnchor = { top: number; left: number; width: number; height: number; x?: number; y?: number };

interface Props {
  selected: { insight: BriefingThinkingInsight; anchor: DetailAnchor } | null;
  onClose: () => void;
}

function anchoredStyle(anchor: DetailAnchor) {
  const width = 500;
  const estimatedHeight = 560;
  const margin = 14;
  if (typeof window === "undefined" || window.innerWidth <= 768) return undefined;
  const clickX = anchor.x ?? anchor.left + anchor.width / 2;
  const clickY = anchor.y ?? anchor.top + anchor.height / 2;
  const hasRoomBelow = clickY + margin + estimatedHeight <= window.innerHeight;
  return {
    width,
    left: Math.max(margin, Math.min(clickX - width / 2, window.innerWidth - width - margin)),
    top: Math.max(
      margin,
      Math.min(hasRoomBelow ? clickY + margin : clickY - estimatedHeight - margin, window.innerHeight - estimatedHeight - margin),
    ),
  };
}

export function ThinkingDetailModal({ selected, onClose }: Props) {
  if (!selected) return null;
  const { insight } = selected;
  const style = anchoredStyle(selected.anchor);

  return createPortal(
    <motion.div className="fixed inset-0 z-[76]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button
        type="button"
        className="absolute inset-0 bg-[var(--overlay-scrim)] backdrop-blur-sm min-[769px]:bg-transparent min-[769px]:backdrop-blur-0"
        aria-label="关闭思考详情"
        onClick={onClose}
      />
      <motion.article
        className="floating-card-premium bottom-0 left-0 right-0 z-10 flex max-h-[100vh] max-h-[calc(100dvh-8px)] w-full flex-col rounded-b-none min-[769px]:bottom-auto min-[769px]:left-auto min-[769px]:right-auto min-[769px]:max-h-[calc(100dvh-36px)] min-[769px]:rounded-[var(--radius-2xl)]"
        style={{ position: "fixed", ...style }}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      >
        <header className="shrink-0 border-b border-[var(--hairline)] bg-[var(--material-elevated)] px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] min-[769px]:pt-3">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[var(--text-faint)] min-[769px]:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--primary-soft)] px-2 py-0.5 text-[var(--primary)]">
                  <BrainCircuit size={11} />
                  值得继续想
                </span>
                <span>{insight.impactLabel}</span>
                <span className="numeric-display">置信 {insight.confidence}</span>
              </div>
              <h3 className="mt-2 text-base font-semibold leading-snug text-[var(--text-primary)]">
                {insight.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--hairline)] text-[var(--text-muted)] transition hover:bg-[var(--interactive-hover)] hover:text-[var(--text-primary)]"
              aria-label="关闭"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <p className="font-[var(--font-reading)] text-sm leading-7 text-[var(--text-secondary)]">
            {insight.whyItMatters}
          </p>
          <p className="mt-3 font-[var(--font-reading)] text-sm leading-7 text-[var(--text-secondary)]">
            {insight.thesis}
          </p>
          <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3.5 py-3">
            <p className="mb-1.5 text-xs text-[var(--primary)]">今天可以追问</p>
            <p className="font-[var(--font-reading)] text-sm leading-7 text-[var(--text-secondary)]">
              {insight.question}
            </p>
          </div>

          {insight.sourceTitles.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-xs text-[var(--text-muted)]">依据来源</p>
              <div className="space-y-2">
                {insight.sourceTitles.slice(0, 6).map((title) => (
                  <p key={title} className="rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 py-2 text-xs leading-5 text-[var(--text-secondary)]">
                    {title}
                  </p>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-1.5">
            {insight.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="rounded-[var(--radius-pill)] border border-[var(--hairline)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
                {tag}
              </span>
            ))}
          </div>
          {insight.habitSignals.length > 0 ? (
            <p className="mt-3 text-xs leading-6 text-[var(--text-muted)]">
              结合你的思考习惯：{insight.habitSignals.join(" / ")}
            </p>
          ) : null}
        </div>
      </motion.article>
    </motion.div>,
    document.body,
  );
}
