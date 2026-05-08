"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Bookmark, FilePlus2, X } from "lucide-react";
import { Button } from "@/components/base/Button";
import { proxyImageUrl } from "@/lib/briefing/utils";
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

export function NewsDetailModal({ item, onClose, onPatchItem }: Props) {
  const [saving, setSaving] = useState(false);

  async function importNote() {
    if (saving || item.isImported) return;
    setSaving(true);
    const res = await fetch("/api/briefing/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "item", itemId: item.id }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.ok) onPatchItem(item.id, { isImported: true, importedNoteId: json.noteId, isRead: true });
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

  const categoryLabel = item.category === "world" ? "世界" : item.category === "finance" ? "金融" : "AI 科技";

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Card */}
        <motion.div
          className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto card-premium p-6 sm:p-8"
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full border border-[var(--hairline)] p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--interactive-hover)] transition-colors">
            <X size={16} />
          </button>

          {/* Image */}
          <div className="-mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-5 aspect-[16/9] overflow-hidden bg-[var(--material-inset)]">
            <img
              src={proxyImageUrl(item.imageUrl) ?? ""}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>

          {/* Category badge */}
          <span className="inline-block rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2.5 py-0.5 text-[11px] text-[var(--text-muted)]">
            {categoryLabel}
          </span>

          {/* Title */}
          <h2 className="mt-3 text-xl font-semibold leading-snug tracking-[-0.035em] text-[var(--text-primary)] sm:text-2xl">
            {item.title}
          </h2>

          {/* Meta */}
          <p className="mt-2 numeric-display text-xs text-[var(--text-muted)]">
            {item.sourceName} · {formatTime(item.publishedAt)}
          </p>

          {/* Summary */}
          <div className="mt-5 rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--ai-accent)] font-medium mb-1">AI 摘要</p>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {item.aiSummary || item.excerpt || "暂无摘要"}
            </p>
          </div>

          {/* Key points */}
          {item.aiKeyPoints.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">要点</p>
              <ul className="space-y-1.5">
                {item.aiKeyPoints.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)] opacity-60" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Content */}
          {item.content && item.content.length > 20 && (
            <div className="mt-5">
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-2">内容</p>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-12 whitespace-pre-line">
                {item.content.replace(/<[^>]+>/g, "").slice(0, 2000)}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--hairline)] pt-4">
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
