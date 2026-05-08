"use client";

import { motion } from "framer-motion";
import { Bookmark } from "lucide-react";
import { card3DHover } from "@/lib/animations";
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

  const scoreLabel = item.aiScore != null && item.aiScore > 0.6 ? "重点" : item.aiScore != null && item.aiScore > 0.4 ? "关注" : "";

  return (
    <motion.article
      {...card3DHover}
      onClick={() => {
        markRead();
        onClick({ ...item, isRead: true });
      }}
      className="group relative cursor-pointer py-4"
    >
      {!item.isRead && <span className="absolute left-0 top-5 h-2 w-2 rounded-full bg-[var(--primary)]" />}

      <div className={`pl-3.5 ${!item.isRead ? "" : ""}`}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-[11px] text-[var(--text-muted)]">
            {item.sourceName} · {timeAgo(item.publishedAt)}
            {scoreLabel && <span className="ml-1.5 text-[var(--ai-accent)]">{scoreLabel}</span>}
          </p>
          <button
            type="button"
            aria-label={item.isFavorited ? "取消收藏" : "收藏"}
            onClick={toggleFavorite}
            className={`rounded p-1 transition-colors sm:opacity-0 sm:group-hover:opacity-100 ${item.isFavorited ? "text-[var(--primary)] sm:opacity-100" : "text-[var(--text-muted)] hover:text-[var(--primary)]"} hover:bg-[var(--interactive-hover)]`}
          >
            <Bookmark size={14} />
          </button>
        </div>

        <div className="min-w-0">
          <h3 className={`line-clamp-2 text-[15px] font-medium leading-snug transition-colors group-hover:text-[var(--primary)] ${item.isRead ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}>
            {item.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
            {item.aiSummary || item.excerpt || "暂无摘要"}
          </p>
        </div>
      </div>
    </motion.article>
  );
}
