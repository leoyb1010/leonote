"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Bookmark, FilePlus2, X } from "lucide-react";
import { Button } from "@/components/base/Button";
import { categoryLabel } from "@/lib/briefing/display";
import type { NewsItemDTO } from "@/lib/briefing/types";

interface Props {
  item: NewsItemDTO;
  onClose: () => void;
  onPatchItem: (itemId: string, patch: Partial<NewsItemDTO>) => void;
}

function formatTime(input: string) {
  return new Date(input).toLocaleString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function cleanContent(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function NewsDetailModal({ item, onClose, onPatchItem }: Props) {
  const [saving, setSaving] = useState(false);
  const content = useMemo(() => cleanContent(item.content || item.excerpt || ""), [item.content, item.excerpt]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  async function importNote() {
    if (saving || item.isImported) return;
    setSaving(true);
    try {
      const res = await fetch("/api/briefing/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "item", itemId: item.id }),
      });
      const json = await res.json();
      if (json.ok) onPatchItem(item.id, { isImported: true, importedNoteId: json.noteId, isRead: true });
    } finally {
      setSaving(false);
    }
  }

  async function toggleFavorite() {
    const next = !item.isFavorited;
    onPatchItem(item.id, { isFavorited: next });
    await fetch("/api/briefing/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, isFavorited: next }),
    });
  }

  const label = categoryLabel(item.category);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          className="card-premium relative z-10 flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden"
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ type: "spring", stiffness: 340, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--hairline)] bg-[var(--material-elevated)] px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="truncate text-xs text-[var(--text-muted)]">
                {label} · {item.sourceName} · {formatTime(item.publishedAt)}
              </p>
            </div>
            <button
              type="button"
              aria-label="关闭"
              onClick={onClose}
              className="rounded-full border border-[var(--hairline)] p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--interactive-hover)] hover:text-[var(--text-primary)]"
            >
              <X size={16} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <span className="inline-block rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2.5 py-1 text-[11px] text-[var(--text-muted)]">
              {label}
            </span>

            <h2 className="mt-3 text-xl font-semibold leading-snug text-[var(--text-primary)] sm:text-2xl">
              {item.title}
            </h2>

            <div className="mt-5 rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] p-4">
              <p className="mb-1 text-[11px] font-medium text-[var(--ai-accent)]">智能摘要</p>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                {item.aiSummary || item.excerpt || "暂无摘要"}
              </p>
            </div>

            {item.aiKeyPoints.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">要点</p>
                <ul className="space-y-2">
                  {item.aiKeyPoints.map((point, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)] opacity-60" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {content.length > 20 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">正文摘录</p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
                  {content.slice(0, 2600)}
                </p>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-[var(--hairline)] bg-[var(--material-elevated)] px-4 py-3 sm:px-5">
            <Button size="sm" onClick={importNote} disabled={saving || item.isImported} className="gap-1.5">
              <FilePlus2 size={14} />
              {item.isImported ? "已存入笔记" : saving ? "保存中…" : "存为笔记"}
            </Button>
            <button
              onClick={toggleFavorite}
              className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs transition-colors ${
                item.isFavorited
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "border-[var(--hairline)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--text-secondary)]"
              }`}
            >
              <Bookmark size={13} />
              {item.isFavorited ? "已收藏" : "收藏"}
            </button>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--hairline)] px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--text-secondary)] transition-colors"
            >
              <ArrowUpRight size={13} />
              阅读原文
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
