"use client";

import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Check, ChevronRight, CloudSun, Copy, FilePlus2, Gauge, Loader2, MoonStar, Newspaper, RefreshCw, Star, Tags, X } from "lucide-react";
import { Button } from "@/components/base/Button";
import { cardFloatIn, heroTitleReveal } from "@/lib/animations";
import type { BriefingDigestSummary, BriefingRange, HoroscopeDTO, WeatherDTO } from "@/lib/briefing/types";

export interface BriefingHeroStats {
  total: number;
  unread: number;
  averageScore: number | null;
  topTags: string[];
}

interface Props {
  digest: BriefingDigestSummary | null;
  stats: BriefingHeroStats;
  weather: WeatherDTO | null;
  horoscopes: HoroscopeDTO[];
  dateLabel: string;
  range: BriefingRange;
  title: string;
  loading?: boolean;
  importingDigest?: boolean;
  copied?: boolean;
  onRefresh: () => void;
  onImportDigest: () => void;
  onCopySummary: () => void;
  onTitleChange: (title: string) => void;
}

type DetailAnchor = { x: number; y: number; top: number; left: number; width: number; height: number };
type SelectedHoroscope = { horoscope: HoroscopeDTO; anchor: DetailAnchor };
function HoroscopeDetailBubble({
  selected,
  onClose,
}: {
  selected: SelectedHoroscope | null;
  onClose: () => void;
}) {
  if (!selected) return null;
  const { horoscope, anchor } = selected;
  const width = 430;
  const estimatedHeight = 440;
  const margin = 14;
  const viewportWidth = typeof window === "undefined" ? 0 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight;
  const hasRoomBelow = anchor.y + margin + estimatedHeight <= viewportHeight;
  const desktopStyle = viewportWidth > 768
    ? {
        width,
        left: Math.max(margin, Math.min(anchor.x - width / 2, viewportWidth - width - margin)),
        top: Math.max(
          margin,
          Math.min(
            hasRoomBelow ? anchor.y + margin : anchor.y - estimatedHeight - margin,
            viewportHeight - estimatedHeight - margin,
          ),
        ),
      }
    : undefined;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[70]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[var(--overlay-scrim)] backdrop-blur-sm min-[769px]:bg-transparent min-[769px]:backdrop-blur-0"
        aria-label="关闭星座详情"
        onClick={onClose}
      />
      <motion.article
        className="floating-card-premium bottom-0 left-0 right-0 z-10 flex max-h-[100vh] max-h-[calc(100dvh-8px)] w-full flex-col overscroll-contain rounded-b-none min-[769px]:bottom-auto min-[769px]:left-auto min-[769px]:right-auto min-[769px]:max-h-[calc(100dvh-36px)] min-[769px]:rounded-[var(--radius-2xl)]"
        style={{ position: "fixed", ...desktopStyle }}
        initial={{ opacity: 0, y: 18, x: 0, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, x: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      >
        <header className="shrink-0 border-b border-[var(--hairline)] bg-[var(--material-elevated)] px-4 py-3 pr-[max(1rem,env(safe-area-inset-right))] pt-[calc(0.75rem+env(safe-area-inset-top))] min-[769px]:pt-3">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[var(--text-faint)] min-[769px]:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--primary-soft)] px-2 py-0.5 text-[var(--primary)]">
                  <MoonStar size={11} />
                  今日星座
                </span>
                <span>{horoscope.signName}</span>
              </div>
              <h3 className="mt-2 text-base font-semibold leading-snug text-[var(--text-primary)]">
                {horoscope.name} · {horoscope.signName}
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
          <div className="mb-3 flex items-center gap-2">
            <StarRating value={horoscope.stars} />
            <span className="text-xs text-[var(--text-muted)]">{horoscope.stars}/5</span>
          </div>
          <p className="font-[var(--font-reading)] text-sm leading-7 text-[var(--text-secondary)]">
            {horoscope.summary}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] text-[var(--text-muted)]">
            <span>来源：{horoscope.sourceName || "未知"}</span>
            {horoscope.updatedAt ? (
              <>
                <span>·</span>
                <span className="tabular">更新 {formatHoroscopeTime(horoscope.updatedAt)}</span>
              </>
            ) : null}
          </div>
          {horoscope.isFallback ? (
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">此为兜底内容，实时源稍后刷新。</p>
          ) : null}
        </div>
      </motion.article>
    </motion.div>,
    document.body,
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} 星`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={12}
          className={index < value ? "fill-[var(--warning)] text-[var(--warning)]" : "text-[var(--text-faint)]"}
        />
      ))}
    </span>
  );
}

function formatHoroscopeTime(input: string | null | undefined) {
  if (!input) return "等待同步";
  const date = new Date(input);
  if (!Number.isFinite(date.getTime())) return "等待同步";
  return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function HoroscopeStrip({ horoscopes, onSelect }: { horoscopes: HoroscopeDTO[]; onSelect: (horoscope: HoroscopeDTO, anchor: DetailAnchor) => void }) {
  const latestUpdate = horoscopes
    .map((item) => new Date(item.updatedAt))
    .filter((date) => Number.isFinite(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const sourceLabel = Array.from(new Set(horoscopes.map((item) => item.sourceName))).join(" / ") || "实时源待同步";

  return (
    <div className="quiet-inset rounded-[var(--radius-lg)] px-3.5 py-3">
      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
        <MoonStar size={13} />
        今日星座
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-1">
        {horoscopes.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 py-5 text-center text-[11px] leading-5 text-[var(--text-muted)]">
            实时星座源暂未返回，稍后刷新。
          </div>
        ) : (
          horoscopes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                onSelect(item, {
                  x: event.clientX || rect.left + rect.width / 2,
                  y: event.clientY || rect.top + rect.height / 2,
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                });
              }}
              className="group cursor-pointer rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 py-2 text-left transition hover:-translate-y-0.5 hover:bg-[var(--material-muted)]"
            >
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate font-medium text-[var(--text-secondary)]">
                  {item.name} · {item.signName}
                </span>
                <span className="shrink-0 tabular">
                  <StarRating value={item.stars} />
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-[var(--text-muted)]">
                {item.summary}
              </p>
              <div className="mt-1.5 flex items-center justify-end text-[var(--text-muted)]">
                <ChevronRight size={11} className="transition group-hover:translate-x-0.5" />
              </div>
            </button>
          ))
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] leading-5 text-[var(--text-muted)]">
        <span className="min-w-0 truncate">来源：{sourceLabel}</span>
        <span className="shrink-0 tabular">更新 {formatHoroscopeTime(latestUpdate?.toISOString())}</span>
      </div>
    </div>
  );
}

function rangeLabel(range: BriefingRange) {
  if (range === "week") return "最近 7 天";
  if (range === "favorites") return "收藏简报";
  return "今日简报";
}

function qualityLabel(score: number | null) {
  if (score == null) return "等待评分";
  if (score >= 80) return "高质量";
  if (score >= 60) return "可读";
  return "待筛选";
}

function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint: string;
}) {
  return (
    <div className="quiet-inset rounded-[var(--radius-lg)] px-3.5 py-3">
      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
        <span className="text-[var(--text-faint)]">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-[1.35rem] font-semibold leading-none text-[var(--text-primary)]">
        {value}
      </div>
      <p className="mt-1.5 text-[11px] leading-4 text-[var(--text-muted)]">{hint}</p>
    </div>
  );
}

export function BriefingHero({
  stats,
  weather,
  horoscopes,
  dateLabel,
  range,
  title,
  loading = false,
  importingDigest = false,
  copied = false,
  onRefresh,
  onImportDigest,
  onCopySummary,
  onTitleChange,
}: Props) {
  const score = stats.averageScore == null ? null : Math.round(stats.averageScore);
  const [selectedHoroscope, setSelectedHoroscope] = useState<SelectedHoroscope | null>(null);
  const horoscopeBrief = horoscopes.length
    ? horoscopes.map((item) => `${item.name} ${item.stars}星`).join(" · ")
    : "等待同步";

  return (
    <motion.section
      variants={cardFloatIn}
      initial="initial"
      animate="animate"
      className="card-premium relative overflow-hidden p-4 sm:p-5 md:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.055),transparent_32%),radial-gradient(circle_at_92%_18%,var(--primary-soft),transparent_28%)]" />

      <div className="relative z-10 grid gap-5 md:grid-cols-[minmax(0,1fr)_300px] md:items-start xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2.5 py-1">
              <CalendarDays size={13} />
              {dateLabel}
            </span>
            <span className="rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2.5 py-1">
              {rangeLabel(range)}
            </span>
            {weather ? (
              <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2.5 py-1">
                <CloudSun size={13} />
                深圳 {Math.round(weather.temp)}° · {weather.weatherLabel} · 湿度 {weather.humidity}%
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2.5 py-1">
              <MoonStar size={13} />
              今日星座 · {horoscopeBrief}
            </span>
          </div>

          <motion.div
            variants={heroTitleReveal}
          >
            <input
              aria-label="简报标题"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              className="w-full max-w-3xl bg-transparent text-[1.7rem] font-semibold leading-tight text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-placeholder)] focus:text-[var(--primary)] sm:text-[2.15rem]"
              placeholder="每日简报"
            />
          </motion.div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={onRefresh} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              刷新简报
            </Button>
            <Button variant="secondary" size="sm" onClick={onImportDigest} disabled={importingDigest || stats.total === 0} className="gap-1.5">
              {importingDigest ? <Loader2 size={14} className="animate-spin" /> : <FilePlus2 size={14} />}
              存为笔记
            </Button>
            <Button variant="ghost" size="sm" onClick={onCopySummary} disabled={stats.total === 0} className="gap-1.5">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "已复制" : "复制摘要"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:pt-1">
          <MetricCard
            icon={<Newspaper size={13} />}
            label="资讯"
            value={<span className="numeric-display">{stats.total}</span>}
            hint={`${stats.unread} 条未读`}
          />
          <MetricCard
            icon={<Gauge size={13} />}
            label="质量"
            value={<span className="numeric-display">{score == null ? "..." : `${score}`}</span>}
            hint={qualityLabel(score)}
          />
          <div className="quiet-inset col-span-2 rounded-[var(--radius-lg)] px-3.5 py-3">
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <Tags size={13} />
              重要标签
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(stats.topTags.length ? stats.topTags : ["等待标签"]).slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-elevated)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <HoroscopeStrip horoscopes={horoscopes} onSelect={(h, anchor) => setSelectedHoroscope({ horoscope: h, anchor })} />
          </div>
        </div>
      </div>

      <HoroscopeDetailBubble selected={selectedHoroscope} onClose={() => setSelectedHoroscope(null)} />
    </motion.section>
  );
}
