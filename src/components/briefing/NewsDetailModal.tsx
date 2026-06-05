"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Bookmark, ChevronDown, Clock3, FilePlus2, Loader2, Sparkles, Tags, X } from "lucide-react";
import { Button } from "@/components/base/Button";
import { categoryLabel } from "@/lib/briefing/display";
import { proxyImageUrl } from "@/lib/briefing/utils";
import type { NewsItemDTO } from "@/lib/briefing/types";

interface Props {
  item: NewsItemDTO;
  anchorRect?: { top: number; left: number; width: number; height: number };
  onClose: () => void;
  onPatchItem: (itemId: string, patch: Partial<NewsItemDTO>) => void;
}

function formatTime(input: string) {
  return new Date(input).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const COMMENT_NOISE_RE = /^(回复|楼主|沙发|板凳|引用|附议|点赞|收藏|举报|顶|踩|来自|发表于|发布于|edited|reply|re[:：]|@[\w一-鿿-]+)/i;
const COMMENT_META_RE = /(\d+\s*个?\s*(回复|评论|赞|楼|帖子))|^#?\d+\s*(楼|f|F)\b|^\d{1,2}[:：]\d{2}([:：]\d{2})?$|^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/;
const SHORT_REPLY_RE = /^(同意|赞同|\+1|顶|\+\+|哈哈哈|niubi|nb|牛逼|👍|🆙|mark|占楼|学习了|确实|的确|没错|好的|谢谢|感谢)/i;

function safeDetailText(input: string) {
  const lines = input
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => {
      if (line.length < 12) return false;
      if (/^(id|guid|url|source|content|score|json|rss|api)\s*[:=：]/i.test(line)) return false;
      if (/https?:\/\/|utm_|cookie|subscribe|copyright|read more/i.test(line)) return false;
      if (COMMENT_NOISE_RE.test(line)) return false;
      if (COMMENT_META_RE.test(line)) return false;
      if (SHORT_REPLY_RE.test(line) && line.length < 40) return false;
      // 行内带大量 emoji / 重复短回复符号也丢
      if ((line.match(/[😂🤣👍😄😅🙏❤️🔥]/g)?.length ?? 0) >= 3) return false;
      return true;
    });

  // 去重：避免同一段重复出现（社区帖常见）
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const line of lines) {
    const key = line.slice(0, 48);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(line);
  }

  return deduped.join("\n").slice(0, 1600).trim();
}

function splitIntoSentences(text: string, limit = 4): string[] {
  return text
    .split(/(?<=[。！？!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 14)
    .slice(0, limit);
}

function scoreLabel(score: number | null) {
  if (score == null) return "待评分";
  const percent = Math.round(score * 100);
  if (percent >= 80) return `${percent} · 高质量`;
  if (percent >= 60) return `${percent} · 值得读`;
  return `${percent} · 快速浏览`;
}

export function NewsDetailModal({ item, anchorRect, onClose, onPatchItem }: Props) {
  const [saving, setSaving] = useState(false);
  const [imageHidden, setImageHidden] = useState(false);
  const [showRawDetail, setShowRawDetail] = useState(false);
  const [panelPosition, setPanelPosition] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const detailText = useMemo(() => safeDetailText(item.detailText || item.aiSummary || item.excerpt || ""), [item.detailText, item.aiSummary, item.excerpt]);
  const summaryText = item.aiSummary?.trim() || item.excerpt?.trim() || splitIntoSentences(detailText, 2).join(" ") || "摘要正在生成，可阅读原文获取完整内容。";
  // 当 aiKeyPoints 为空时，从 detailText 自动拆出 2-3 句作为关键要点兜底，避免详情只剩一坨"正文摘录"
  const keyPoints = useMemo(() => {
    if (item.aiKeyPoints.length > 0) return item.aiKeyPoints;
    const sentences = splitIntoSentences(detailText, 3);
    // 不要把摘要那句重复成"要点"
    return sentences.filter((s) => !summaryText.includes(s.slice(0, 18)));
  }, [item.aiKeyPoints, detailText, summaryText]);
  const imageUrl = !imageHidden ? proxyImageUrl(item.imageUrl) : null;
  // Guard the outbound link: only render http(s) hrefs so a stored `javascript:`/`data:` url
  // (from a malicious/compromised feed) can't execute on click. Defends rows already in the DB.
  const safeUrl = /^https?:\/\//i.test(item.url) ? item.url : null;

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

  useEffect(() => {
    function updatePanelPosition() {
      if (window.innerWidth < 720) {
        setPanelPosition(null);
        return;
      }

      const margin = 18;
      const width = Math.min(window.innerWidth - margin * 2, window.innerWidth >= 1280 ? 820 : 720);
      const maxHeight = Math.min(window.innerHeight - margin * 2, 820);
      const measuredHeight = panelRef.current
        ? Math.max(panelRef.current.offsetHeight, panelRef.current.scrollHeight)
        : 620;
      const currentHeight = Math.min(measuredHeight, maxHeight);
      const rawTop = anchorRect ? anchorRect.top - 12 : margin;
      const top = Math.min(
        Math.max(margin, rawTop),
        Math.max(margin, window.innerHeight - currentHeight - margin),
      );
      const rawLeft = anchorRect ? anchorRect.left - 8 : window.innerWidth / 2 - width / 2;
      const left = Math.min(
        Math.max(margin, rawLeft),
        Math.max(margin, window.innerWidth - width - margin),
      );

      setPanelPosition({ top, left, width, maxHeight });
    }

    const frames = [
      window.requestAnimationFrame(updatePanelPosition),
      window.requestAnimationFrame(() => window.requestAnimationFrame(updatePanelPosition)),
    ];
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updatePanelPosition);
    if (panelRef.current) observer?.observe(panelRef.current);

    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("orientationchange", updatePanelPosition);
    return () => {
      frames.forEach((frame) => window.cancelAnimationFrame(frame));
      observer?.disconnect();
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("orientationchange", updatePanelPosition);
    };
  }, [anchorRect, item.id, detailText]);

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

  const modal = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="absolute inset-0 bg-[var(--overlay-scrim)] backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          ref={panelRef}
          className="floating-card-premium bottom-0 left-0 right-0 z-10 flex max-h-[calc(100dvh-8px)] w-full flex-col overscroll-contain rounded-b-none sm:bottom-auto sm:right-auto sm:max-h-[calc(100dvh-36px)] sm:rounded-[var(--radius-xl)]"
          style={{ position: "fixed", ...panelPosition }}
          initial={{ opacity: 0, scale: 0.985, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.985, y: 16 }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--hairline)] bg-[var(--material-elevated)] px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-5 sm:pt-3">
            <div className="min-w-0">
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[var(--text-faint)] sm:hidden" />
              <p className="truncate text-xs text-[var(--text-muted)]">
                {label} · {item.sourceName} · {formatTime(item.publishedAt)}
              </p>
            </div>
            <button
              type="button"
              aria-label="关闭"
              onClick={onClose}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--hairline)] text-[var(--text-muted)] transition-colors hover:bg-[var(--interactive-hover)] hover:text-[var(--text-primary)]"
            >
              <X size={16} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {imageUrl ? (
              <div className="relative h-44 overflow-hidden border-b border-[var(--hairline)] bg-[var(--material-inset)] sm:h-56">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt=""
                  onError={() => setImageHidden(true)}
                  className="h-full w-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--material-elevated)] via-transparent to-transparent" />
              </div>
            ) : null}

            <div className="px-4 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
                <span className="rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2.5 py-1">
                  {label}
                </span>
                <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2.5 py-1">
                  <Clock3 size={12} />
                  {item.readingMinutes} 分钟
                </span>
                <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--primary-soft)] px-2.5 py-1 text-[var(--primary)]">
                  <Sparkles size={12} />
                  {scoreLabel(item.aiScore)}
                </span>
              </div>

              <h2 className="mt-4 text-[1.35rem] font-semibold leading-snug text-[var(--text-primary)] sm:text-[1.65rem]">
                {item.title}
              </h2>

              {item.aiTags.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.aiTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"
                    >
                      <Tags size={11} />
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <section className="mt-6 rounded-[var(--radius-lg)] border border-[var(--primary-soft)] bg-[var(--primary-soft)]/40 p-4 sm:p-5">
                <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--primary)]">
                  <Sparkles size={12} />
                  核心摘要
                </p>
                <p className="font-[var(--font-reading)] text-[15px] leading-7 text-[var(--text-primary)] sm:text-base sm:leading-8">
                  {summaryText}
                </p>
              </section>

              {keyPoints.length > 0 ? (
                <section className="mt-5">
                  <p className="mb-3 text-xs font-medium text-[var(--text-secondary)]">关键要点</p>
                  <ul className="space-y-2.5">
                    {keyPoints.map((point) => (
                      <li key={point} className="flex gap-2.5 font-[var(--font-reading)] text-[14px] leading-6 text-[var(--text-secondary)]">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)] opacity-70" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {detailText && detailText !== summaryText ? (
                <section className="mt-5">
                  <button
                    type="button"
                    onClick={() => setShowRawDetail((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                    aria-expanded={showRawDetail}
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${showRawDetail ? "rotate-180" : ""}`}
                    />
                    {showRawDetail ? "收起原文摘录" : "展开原文摘录"}
                  </button>
                  {showRawDetail ? (
                    <p className="mt-3 whitespace-pre-line font-[var(--font-reading)] text-[13px] leading-6 text-[var(--text-muted)]">
                      {detailText}
                    </p>
                  ) : null}
                </section>
              ) : null}

              <p className="mt-6 text-[11px] leading-5 text-[var(--text-faint)]">
                完整内容请点击底部「阅读原文」前往源站点查看。
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--hairline)] bg-[var(--material-elevated)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-5 sm:pb-3">
            <Button size="sm" onClick={importNote} disabled={saving || item.isImported} className="gap-1.5">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <FilePlus2 size={14} />}
              {item.isImported ? "已存入笔记" : "存为笔记"}
            </Button>
            <Button size="sm" variant="secondary" onClick={toggleFavorite} className="gap-1.5">
              <Bookmark size={14} />
              {item.isFavorited ? "已收藏" : "收藏"}
            </Button>
            {safeUrl ? (
              <Button size="sm" variant="ghost" asChild>
                <a href={safeUrl} target="_blank" rel="noreferrer" className="gap-1.5">
                  <ArrowUpRight size={14} />
                  阅读原文
                </a>
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onClick={onClose} className="ml-auto gap-1.5 sm:ml-0">
              <X size={14} />
              关闭
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
