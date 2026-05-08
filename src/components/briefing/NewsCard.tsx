"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, FilePlus2 } from "lucide-react";
import { card3DHover } from "@/lib/animations";
import { proxyImageUrl } from "@/lib/briefing/utils";
import type { NewsItemDTO } from "@/lib/briefing/types";

interface Props {
  item: NewsItemDTO;
  onPatchItem: (itemId: string, patch: Partial<NewsItemDTO>) => void;
  onClick: (item: NewsItemDTO) => void;
}

function timeAgo(input: string) {
  const delta = Date.now() - new Date(input).getTime();
  const minutes = Math.max(1, Math.floor(delta / 60_000));
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

export function NewsCard({ item, onPatchItem, onClick }: Props) {
  const [saving, setSaving] = useState(false);

  async function markRead() {
    if (item.isRead) return;
    onPatchItem(item.id, { isRead: true });
    await fetch("/api/briefing/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, isRead: true }),
    });
  }

  async function toggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !item.isFavorited;
    onPatchItem(item.id, { isFavorited: next });
    await fetch("/api/briefing/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, isFavorited: next }),
    });
  }

  async function importNote(e: React.MouseEvent) {
    e.stopPropagation();
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

  const scoreStars = item.aiScore != null && item.aiScore > 0.6 ? "★" : item.aiScore != null && item.aiScore > 0.4 ? "✦" : "";

  return (
    <motion.article
      {...card3DHover}
      onClick={() => {
        markRead();
        onClick(item);
      }}
      className="group relative cursor-pointer py-4"
    >
      {/* Unread dot */}
      {!item.isRead && <span className="absolute left-0 top-5 h-2 w-2 rounded-full bg-[var(--primary)]" />}

      <div className={`pl-3.5 ${!item.isRead ? "" : ""}`}>
        {/* Source + time */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="numeric-display text-[11px] text-[var(--text-muted)]">
            {item.sourceName} · {timeAgo(item.publishedAt)}
            {scoreStars && <span className="ml-1.5 text-[var(--ai-accent)]">{scoreStars}</span>}
          </p>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={importNote} className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--interactive-hover)]">
              <FilePlus2 size={13} />
            </button>
            <button onClick={toggleFavorite} className={`rounded p-1 ${item.isFavorited ? "text-[var(--primary)]" : "text-[var(--text-muted)] hover:text-[var(--primary)]"} hover:bg-[var(--interactive-hover)]`}>
              <Bookmark size={13} />
            </button>
          </div>
        </div>

        {/* Title + image */}
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <h3 className={`line-clamp-2 text-sm font-medium leading-snug tracking-[-0.02em] group-hover:text-[var(--primary)] transition-colors ${item.isRead ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}>
              {item.title}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
              {item.aiSummary || item.excerpt || "暂无摘要"}
            </p>
          </div>
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--material-inset)]">
            <img
              src={proxyImageUrl(item.imageUrl) ?? ""}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-[var(--text-muted)] pointer-events-none -z-10">
              {item.sourceName.slice(0, 2)}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
