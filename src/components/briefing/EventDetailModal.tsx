"use client";

import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { ExternalLink, RadioTower, X } from "lucide-react";
import type { BriefingEventClusterDTO, BriefingXSignalDTO, NewsItemDTO } from "@/lib/briefing/types";

type DetailAnchor = { top: number; left: number; width: number; height: number; x?: number; y?: number };
type SelectedEvent = { event: BriefingEventClusterDTO; anchor: DetailAnchor };
type SelectedSignal = { signal: BriefingXSignalDTO; anchor: DetailAnchor };

interface Props {
  selected: SelectedEvent | SelectedSignal | null;
  items: NewsItemDTO[];
  onClose: () => void;
}

function isSignal(selected: SelectedEvent | SelectedSignal): selected is SelectedSignal {
  return "signal" in selected;
}

function anchoredStyle(anchor: DetailAnchor) {
  const width = 520;
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

export function EventDetailModal({ selected, items, onClose }: Props) {
  if (!selected) return null;

  const style = anchoredStyle(selected.anchor);
  const relatedItems = isSignal(selected)
    ? items.filter((item) => item.id === selected.signal.itemId)
    : items.filter((item) => selected.event.itemIds.includes(item.id)).slice(0, 6);
  const title = isSignal(selected) ? selected.signal.title : selected.event.title;
  const summary = isSignal(selected) ? selected.signal.summary : selected.event.summary;
  const impactLabel = isSignal(selected) ? selected.signal.impactLabel : selected.event.impactLabel;
  const tags = isSignal(selected) ? selected.signal.tags : selected.event.tags;

  return createPortal(
    <motion.div className="fixed inset-0 z-[75]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <button
        type="button"
        className="absolute inset-0 bg-[var(--overlay-scrim)] backdrop-blur-sm min-[769px]:bg-transparent min-[769px]:backdrop-blur-0"
        aria-label="关闭详情"
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
                  {isSignal(selected) ? <RadioTower size={11} /> : null}
                  {isSignal(selected) ? "X 信号" : selected.event.scopeLabel}
                </span>
                <span>{impactLabel}</span>
              </div>
              <h3 className="mt-2 text-base font-semibold leading-snug text-[var(--text-primary)]">
                {title}
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
          <p className="font-[var(--font-reading)] text-sm leading-7 text-[var(--text-secondary)]">{summary}</p>

          {!isSignal(selected) ? (
            <>
              <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3.5 py-3">
                <p className="mb-1.5 text-xs text-[var(--primary)]">为什么重要</p>
                <p className="font-[var(--font-reading)] text-sm leading-7 text-[var(--text-secondary)]">{selected.event.whyItMatters}</p>
              </div>
              {selected.event.facts.length > 0 ? (
                <div className="mt-4">
                  <p className="mb-2 text-xs text-[var(--text-muted)]">核心事实</p>
                  <div className="space-y-2">
                    {selected.event.facts.map((fact) => (
                      <p key={fact} className="rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 py-2 text-xs leading-5 text-[var(--text-secondary)]">
                        {fact}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <a
              href={selected.signal.url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--hairline)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition hover:bg-[var(--interactive-hover)] hover:text-[var(--text-primary)]"
            >
              <ExternalLink size={13} />
              查看 X 原文
            </a>
          )}

          <div className="mt-4 flex flex-wrap gap-1.5">
            {tags.slice(0, 6).map((tag) => (
              <span key={tag} className="rounded-[var(--radius-pill)] border border-[var(--hairline)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
                {tag}
              </span>
            ))}
          </div>

          {relatedItems.length > 0 ? (
            <div className="mt-5">
              <p className="mb-2 text-xs text-[var(--text-muted)]">来源证据</p>
              <div className="space-y-2">
                {relatedItems.map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 py-2 transition hover:bg-[var(--interactive-hover)]"
                  >
                    <span className="block text-xs text-[var(--text-muted)]">{item.sourceName}</span>
                    <span className="mt-1 block text-sm leading-5 text-[var(--text-secondary)]">{item.title}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </motion.article>
    </motion.div>,
    document.body,
  );
}
