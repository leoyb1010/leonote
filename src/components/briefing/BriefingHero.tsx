"use client";

import { motion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Activity, ArrowDownRight, ArrowUpRight, CalendarDays, Check, ChevronRight, CloudSun, Copy, FilePlus2, Gauge, Loader2, MoonStar, Newspaper, RefreshCw, Star, Tags, X } from "lucide-react";
import { Button } from "@/components/base/Button";
import { cardFloatIn, heroTitleReveal } from "@/lib/animations";
import type { BriefingDigestSummary, BriefingRange, HoroscopeDTO, MarketSnapshotDTO, WeatherDTO } from "@/lib/briefing/types";

export interface BriefingHeroStats {
  total: number;
  unread: number;
  averageScore: number | null;
  topTags: string[];
}

interface Props {
  digest: BriefingDigestSummary | null;
  stats: BriefingHeroStats;
  markets: MarketSnapshotDTO[];
  weather: WeatherDTO | null;
  horoscopes: HoroscopeDTO[];
  dateLabel: string;
  range: BriefingRange;
  title: string;
  loading?: boolean;
  importingDigest?: boolean;
  copied?: boolean;
  marketRefreshing?: boolean;
  marketError?: string | null;
  onRefresh: () => void;
  onImportDigest: () => void;
  onCopySummary: () => void;
  onMarketRefresh: () => void;
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
            {horoscope.sourceDate ? (
              <>
                <span>·</span>
                <span>运势日 {formatHoroscopeDate(horoscope.sourceDate)}</span>
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

function formatHoroscopeDate(input: string | null | undefined) {
  if (!input) return "等待同步";
  const date = new Date(input);
  if (!Number.isFinite(date.getTime())) return "等待同步";
  return date.toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai", month: "long", day: "numeric" });
}

function HoroscopeStrip({ horoscopes, onSelect }: { horoscopes: HoroscopeDTO[]; onSelect: (horoscope: HoroscopeDTO, anchor: DetailAnchor) => void }) {
  const latestUpdate = horoscopes
    .map((item) => new Date(item.updatedAt))
    .filter((date) => Number.isFinite(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const sourceLabel = Array.from(new Set(horoscopes.map((item) => item.sourceName))).join(" / ") || "实时源待同步";

  return (
    <div className="mt-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <MoonStar size={13} />
          今日星座
        </span>
        <span className="tabular">更新 {formatHoroscopeTime(latestUpdate?.toISOString())}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {horoscopes.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-4 text-center text-[11px] leading-5 text-[var(--text-muted)] sm:col-span-3">
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
              className="group min-h-[74px] cursor-pointer rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-2 text-left transition hover:-translate-y-0.5 hover:bg-[var(--material-muted)]"
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
              <div className="mt-1 flex items-center justify-end text-[var(--text-muted)]">
                <ChevronRight size={11} className="transition group-hover:translate-x-0.5" />
              </div>
            </button>
          ))
        )}
      </div>
      <div className="mt-2 flex min-w-0 items-center justify-between gap-2 text-[11px] leading-5 text-[var(--text-muted)]">
        <span className="min-w-0 truncate">
          来源：{sourceLabel}
          {horoscopes[0]?.sourceDate ? ` · 运势日 ${formatHoroscopeDate(horoscopes[0].sourceDate)}` : ""}
        </span>
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

function MiniMetric({
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
    <div className="rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
        <span className="text-[var(--text-faint)]">{icon}</span>
        {label}
      </div>
      <div className="mt-1.5 text-lg font-semibold leading-none text-[var(--text-primary)]">
        {value}
      </div>
      <p className="mt-1 text-[11px] leading-4 text-[var(--text-muted)]">{hint}</p>
    </div>
  );
}

function formatMarketPrice(item: MarketSnapshotDTO) {
  const value = item.price;
  if (value >= 1000) return value.toLocaleString("zh-CN", { maximumFractionDigits: 0 });
  if (item.category === "fx" || value < 1) return value.toFixed(4);
  return value.toFixed(2);
}

function heroMarketRank(item: MarketSnapshotDTO) {
  const symbol = item.symbol.toLowerCase();
  const name = item.name.toLowerCase();
  const text = `${symbol} ${name}`;

  if (/sh000001|000001\.ss|上证/.test(text)) return 0;
  if (/sz399001|399001\.sz|深证/.test(text)) return 1;
  if (/gb_ixic|\^ixic|nasdaq|纳斯达克|道琼斯|标普|美股/.test(text)) return 2;
  if (/hkhsi|\^hsi|恒生|港股/.test(text)) return 3;
  if (/usd-cny|cny=x|usd\/cny|美元\/人民币|美元人民币/.test(text)) return 4;
  if (/hf_xau|xau|gc=f|黄金/.test(text)) return 5;
  if (/btc|eth|比特币|以太坊|crypto|虚拟币|加密/.test(text) || item.category === "crypto") {
    return /eth|以太坊/.test(text) ? 6.2 : 6.1;
  }
  if (/hf_cl|hf_oil|cl=f|原油|布伦特|石油/.test(text) || item.category === "energy") return 7;
  return 99;
}

function orderHeroMarkets(markets: MarketSnapshotDTO[]) {
  const preferred = markets.filter((item) => heroMarketRank(item) < 99);
  const source = preferred.length > 0 ? preferred : markets;
  return [...source].sort((a, b) => {
    const byRank = heroMarketRank(a) - heroMarketRank(b);
    if (byRank !== 0) return byRank;
    return Math.abs(b.changePct) - Math.abs(a.changePct);
  });
}

function MarketPulseStrip({
  markets,
  refreshing = false,
  error,
  onRefresh,
}: {
  markets: MarketSnapshotDTO[];
  refreshing?: boolean;
  error?: string | null;
  onRefresh: () => void;
}) {
  const visible = orderHeroMarkets(markets).slice(0, 9);

  return (
    <div className="mt-3 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
          <Activity size={13} />
          <span>市场温度</span>
          {error ? <span className="text-[var(--warning)]">显示缓存</span> : null}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          title="刷新实时行情"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--hairline)] text-[var(--text-muted)] transition hover:bg-[var(--interactive-hover)] hover:text-[var(--text-primary)] disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>
      {visible.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">市场数据收集中。</p>
      ) : (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {visible.map((item) => {
            const up = item.changePct >= 0;
            const Icon = up ? ArrowUpRight : ArrowDownRight;
            return (
              <span
                key={item.symbol}
                className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 py-1.5 text-xs text-[var(--text-secondary)]"
              >
                <span className="font-medium text-[var(--text-primary)]">{item.name}</span>
                <span className="numeric-display text-[var(--text-muted)]">{formatMarketPrice(item)}</span>
                <span className={`inline-flex items-center gap-0.5 numeric-display ${up ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
                  <Icon size={11} />
                  {up ? "+" : ""}{item.changePct.toFixed(2)}%
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function BriefingHero({
  stats,
  markets,
  weather,
  horoscopes,
  dateLabel,
  range,
  title,
  loading = false,
  importingDigest = false,
  copied = false,
  marketRefreshing = false,
  marketError,
  onRefresh,
  onImportDigest,
  onCopySummary,
  onMarketRefresh,
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

      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
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
          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2.5 py-1">
            <MoonStar size={13} />
            <span className="truncate">今日星座 · {horoscopeBrief}</span>
          </span>
        </div>

        <MarketPulseStrip
          markets={markets}
          refreshing={marketRefreshing}
          error={marketError}
          onRefresh={onMarketRefresh}
        />

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,480px)] lg:items-end">
          <div className="min-w-0">
            <motion.div variants={heroTitleReveal}>
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

          <div className="grid gap-2 sm:grid-cols-2">
            <MiniMetric
              icon={<Newspaper size={13} />}
              label="资讯"
              value={<span className="numeric-display">{stats.total}</span>}
              hint={`${stats.unread} 条未读`}
            />
            <MiniMetric
              icon={<Gauge size={13} />}
              label="质量"
              value={<span className="numeric-display">{score == null ? "..." : `${score}`}</span>}
              hint={qualityLabel(score)}
            />
            <div className="rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-2.5 sm:col-span-2">
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <Tags size={13} />
                重要标签
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
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
          </div>
        </div>

        <HoroscopeStrip horoscopes={horoscopes} onSelect={(h, anchor) => setSelectedHoroscope({ horoscope: h, anchor })} />
      </div>

      <HoroscopeDetailBubble selected={selectedHoroscope} onClose={() => setSelectedHoroscope(null)} />
    </motion.section>
  );
}
