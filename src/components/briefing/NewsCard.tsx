"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import { motion } from "framer-motion";
import { Bookmark, CheckCircle2, Clock3, Sparkles } from "lucide-react";
import { quietPress } from "@/lib/animations";
import { categoryLabel } from "@/lib/briefing/display";
import { proxyImageUrl } from "@/lib/briefing/utils";
import type { NewsItemDTO } from "@/lib/briefing/types";

type DetailAnchor = { top: number; left: number; width: number; height: number };

interface Props {
  item: NewsItemDTO;
  featured?: boolean;
  dense?: boolean;
  onPatchItem: (itemId: string, patch: Partial<NewsItemDTO>) => void;
  onClick: (item: NewsItemDTO, anchor: DetailAnchor) => void;
}

function timeAgo(input: string) {
  const delta = Date.now() - new Date(input).getTime();
  const minutes = Math.max(1, Math.floor(delta / 60_000));
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

function scorePercent(score: number | null) {
  if (score == null) return null;
  return Math.round(score * 100);
}

function scoreTone(score: number | null) {
  if (score == null) return "bg-[var(--material-muted)] text-[var(--text-muted)]";
  if (score >= 0.72) return "bg-[var(--success-soft)] text-[var(--success)]";
  if (score >= 0.52) return "bg-[var(--primary-soft)] text-[var(--primary)]";
  return "bg-[var(--warning-soft)] text-[var(--warning)]";
}

export function NewsCard({ item, featured = false, dense = false, onPatchItem, onClick }: Props) {
  const [imageHidden, setImageHidden] = useState(false);
  const imageUrl = !imageHidden ? proxyImageUrl(item.imageUrl) : null;
  const score = scorePercent(item.aiScore);
  const summaryText = item.aiSummary || item.detailText || item.excerpt || "摘要正在生成";

  async function markRead() {
    if (item.isRead) return;
    onPatchItem(item.id, { isRead: true });
    try {
      const res = await fetch("/api/briefing/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, isRead: true }),
      });
      if (!res.ok) throw new Error("mark-read-failed");
    } catch {
      onPatchItem(item.id, { isRead: false });
    }
  }

  async function toggleFavorite(e: MouseEvent) {
    e.stopPropagation();
    const next = !item.isFavorited;
    onPatchItem(item.id, { isFavorited: next });
    try {
      const res = await fetch("/api/briefing/state", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, isFavorited: next }),
      });
      if (!res.ok) throw new Error("favorite-failed");
    } catch {
      onPatchItem(item.id, { isFavorited: !next });
    }
  }

  return (
    <motion.article
      {...quietPress}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        void markRead();
        onClick(
          { ...item, isRead: true },
          { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        );
      }}
      className={`group relative cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-elevated)] transition-[border-color,background-color,transform] duration-[var(--duration-quick)] hover:border-[var(--hairline-strong)] hover:bg-[var(--material-muted)] ${
        featured && !dense ? "min-h-[220px]" : ""
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      {!item.isRead ? <span className="absolute left-3 top-3 z-[1] h-2 w-2 rounded-full bg-[var(--primary)] shadow-sm ring-2 ring-[var(--material-elevated)]" /> : null}

      {featured && !dense && imageUrl ? (
        <div className="relative h-32 overflow-hidden border-b border-[var(--hairline)] bg-[var(--material-inset)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            onError={() => setImageHidden(true)}
            className="h-full w-full object-cover opacity-78 transition-transform duration-[var(--duration-slow)] group-hover:scale-[1.025]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--material-elevated)] via-transparent to-transparent" />
        </div>
      ) : null}

      <div className={dense ? "p-3.5" : featured ? "p-4 sm:p-5" : "p-4"}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <span>{categoryLabel(item.category)}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--text-faint)]" />
              <span className="truncate">{item.sourceName}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--text-faint)]" />
              <span>{timeAgo(item.publishedAt)}</span>
            </div>
          </div>

          <button
            type="button"
            aria-label={item.isFavorited ? "取消收藏" : "收藏"}
            onClick={toggleFavorite}
            className={`shrink-0 rounded-lg p-1.5 transition-colors ${
              item.isFavorited
                ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                : "text-[var(--text-muted)] hover:bg-[var(--interactive-hover)] hover:text-[var(--primary)]"
            }`}
          >
            <Bookmark size={15} />
          </button>
        </div>

        <h3 className={`mt-2 line-clamp-2 font-medium leading-snug transition-colors group-hover:text-[var(--primary)] ${
          dense ? "text-sm" : featured ? "text-[1.05rem]" : "text-[15px]"
        } ${item.isRead ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}>
          {item.title}
        </h3>

        <p className={`mt-2 font-[var(--font-reading)] text-[var(--text-secondary)] ${
          dense ? "line-clamp-2 text-xs leading-5" : "line-clamp-3 text-sm leading-6"
        }`}>
          {summaryText}
        </p>

        {item.aiTags.length > 0 ? (
          <div className={`${dense ? "mt-2 hidden sm:flex" : "mt-3 flex"} flex-wrap gap-1.5`}>
            {item.aiTags.slice(0, featured ? 4 : 3).map((tag) => (
              <span
                key={tag}
                className="rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className={`${dense ? "mt-3" : "mt-4"} flex items-center justify-between gap-3`}>
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1">
              <Clock3 size={12} />
              {item.readingMinutes} 分钟
            </span>
            {item.isRead ? (
              <span className="inline-flex items-center gap-1 text-[var(--success)]">
                <CheckCircle2 size={12} />
                已读
              </span>
            ) : null}
          </div>
          <span className={`inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-1 text-[11px] ${scoreTone(item.aiScore)}`}>
            <Sparkles size={12} />
            {score == null ? "待评分" : `${score}`}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
