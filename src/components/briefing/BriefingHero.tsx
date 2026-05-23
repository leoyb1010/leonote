"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Activity, ArrowDownRight, ArrowUpRight, CalendarDays, Check, ChevronRight, CloudSun, Copy, FilePlus2, Gauge, Loader2, MoonStar, Newspaper, RefreshCw, Star, Tags, X, Sparkles } from "lucide-react";
import { Button } from "@/components/base/Button";
import { cardFloatIn, heroTitleReveal } from "@/lib/animations";
import type { BriefingDigestSummary, BriefingRange, HoroscopeDTO, MarketSnapshotDTO, WeatherDTO } from "@/lib/briefing/types";
import { SpotlightCard } from "@/components/base/SpotlightCard";
import { NumberTicker } from "@/components/base/NumberTicker";

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

// === HOROSCOPE BUBBLE ===
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
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/20 backdrop-blur-md min-[769px]:bg-transparent min-[769px]:backdrop-blur-0"
          aria-label="关闭星座详情"
          onClick={onClose}
        />
        <motion.article
          layoutId={`horoscope-card-${horoscope.id}`}
          className="floating-card-premium bottom-0 left-0 right-0 z-10 flex max-h-[100vh] max-h-[calc(100dvh-8px)] w-full flex-col overscroll-contain rounded-b-none min-[769px]:bottom-auto min-[769px]:left-auto min-[769px]:right-auto min-[769px]:max-h-[calc(100dvh-36px)] min-[769px]:rounded-[24px] bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl"
          style={{ position: "fixed", ...desktopStyle }}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <header className="shrink-0 border-b border-black/5 dark:border-white/5 bg-transparent px-5 py-4 pt-[calc(1rem+env(safe-area-inset-top))] min-[769px]:pt-4">
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-black/20 dark:bg-white/20 min-[769px]:hidden" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase text-[var(--primary)]">
                  <MoonStar size={12} className="animate-pulse" />
                  <span>{horoscope.signName}</span>
                </div>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                  {horoscope.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-[var(--text-secondary)] transition hover:bg-black/10 dark:hover:bg-white/20 hover:scale-105 active:scale-95"
                aria-label="关闭"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="mb-4 flex items-center gap-2">
              <StarRating value={horoscope.stars} />
              <span className="text-sm font-medium text-[var(--text-secondary)]">{horoscope.stars}/5</span>
            </div>
            <p className="font-[var(--font-reading)] text-base leading-relaxed text-[var(--text-primary)]">
              {horoscope.summary}
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)] font-mono">
              <span className="rounded-md bg-black/5 dark:bg-white/5 px-2 py-1">Source: {horoscope.sourceName || "Unknown"}</span>
              {horoscope.updatedAt ? (
                <span className="rounded-md bg-black/5 dark:bg-white/5 px-2 py-1 tabular-nums">Sync {formatHoroscopeTime(horoscope.updatedAt)}</span>
              ) : null}
            </div>
            {horoscope.isFallback ? (
              <p className="mt-3 text-[11px] text-[var(--warning)] flex items-center gap-1"><Loader2 size={10} className="animate-spin" />此为兜底内容，实时源稍后刷新</p>
            ) : null}
          </div>
        </motion.article>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} 星`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={14}
          className={index < value ? "fill-yellow-400 text-yellow-400 drop-shadow-sm" : "text-black/10 dark:text-white/10"}
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
  return (
    <div className="h-full flex flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
          <Sparkles size={14} className="text-purple-500" />
          Today's Stars
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2 flex-1">
        {horoscopes.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 p-4 text-[11px] text-[var(--text-muted)] sm:col-span-2">
            <Loader2 size={14} className="animate-spin mr-2" /> 实时星座源同步中...
          </div>
        ) : (
          horoscopes.slice(0, 4).map((item) => (
            <motion.button
              key={item.id}
              layoutId={`horoscope-card-${item.id}`}
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
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group flex flex-col justify-between cursor-pointer rounded-xl border border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/20 p-3 text-left transition-colors hover:bg-white/60 dark:hover:bg-white/5 backdrop-blur-md"
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <span className="truncate font-medium text-sm text-[var(--text-primary)]">
                  {item.name}
                </span>
                <StarRating value={item.stars} />
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)] opacity-80">
                {item.summary}
              </p>
            </motion.button>
          ))
        )}
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
  value: number | null;
  hint: string;
}) {
  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
        {icon}
        {label}
      </div>
      <div className="mt-2">
        <div className="text-3xl font-bold tracking-tighter text-[var(--text-primary)]">
          {value === null ? "..." : <NumberTicker value={value} />}
        </div>
        <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">{hint}</p>
      </div>
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
    <div className="h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
          <Activity size={14} className="text-blue-500" />
          <span>Market Pulse</span>
          {error ? <span className="ml-2 text-[var(--warning)] px-2 py-0.5 bg-[var(--warning)]/10 rounded-full text-[10px]">缓存</span> : null}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-[var(--text-muted)] transition hover:bg-black/10 dark:hover:bg-white/20 hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin text-blue-500" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-x-auto no-scrollbar mask-edges">
        {visible.length === 0 ? (
          <div className="flex h-full items-center text-xs text-[var(--text-muted)]"><Loader2 size={12} className="animate-spin mr-2" />同步市场数据...</div>
        ) : (
          <div className="flex gap-3 pb-2 h-full items-center">
            {visible.map((item, i) => {
              const up = item.changePct >= 0;
              const Icon = up ? ArrowUpRight : ArrowDownRight;
              return (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
                  key={item.symbol}
                  className="flex-shrink-0 min-w-[140px] flex flex-col gap-1.5 rounded-xl border border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/20 p-3 backdrop-blur-md"
                >
                  <span className="font-medium text-sm text-[var(--text-primary)] truncate">{item.name}</span>
                  <div className="flex items-end justify-between">
                    <span className="text-lg font-bold font-mono tracking-tighter text-[var(--text-primary)]">
                      <NumberTicker value={item.price} format={(val) => formatMarketPrice({ ...item, price: val })} />
                    </span>
                    <span className={`flex items-center text-xs font-bold ${up ? "text-red-500" : "text-green-500"}`}>
                      <Icon size={12} strokeWidth={3} className="mr-0.5" />
                      {Math.abs(item.changePct).toFixed(2)}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// === MAIN HERO BENTO ===
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

  // Staggered animation variants
  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemAnim: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="relative w-full z-10 pt-4 pb-8 sm:pt-6">
      
      {/* Header Info Row */}
      <motion.div 
        variants={itemAnim}
        initial="hidden"
        animate="show"
        className="mb-6 flex flex-wrap items-center gap-3 text-xs"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-black/5 dark:border-white/10 bg-white/50 dark:bg-black/30 backdrop-blur-md px-3 py-1.5 font-medium shadow-sm">
          <CalendarDays size={14} className="text-[var(--primary)]" />
          {dateLabel}
        </span>
        <span className="rounded-full border border-black/5 dark:border-white/10 bg-white/50 dark:bg-black/30 backdrop-blur-md px-3 py-1.5 font-medium shadow-sm">
          {rangeLabel(range)}
        </span>
        {weather ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/5 dark:border-white/10 bg-white/50 dark:bg-black/30 backdrop-blur-md px-3 py-1.5 font-medium shadow-sm">
            <CloudSun size={14} className="text-orange-400" />
            深圳 {Math.round(weather.temp)}° · {weather.weatherLabel} · 💧 {weather.humidity}%
          </span>
        ) : null}
      </motion.div>

      {/* Main Title & Actions */}
      <motion.div 
        variants={itemAnim}
        initial="hidden"
        animate="show"
        className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end justify-between"
      >
        <div className="min-w-0 flex-1">
          <input
            aria-label="简报标题"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="w-full bg-transparent text-4xl font-extrabold tracking-tight text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-placeholder)] focus:text-[var(--primary)] sm:text-5xl lg:text-6xl"
            placeholder="每日简报"
          />
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1 sm:overflow-visible sm:pb-0">
          <Button variant="primary" size="sm" onClick={onRefresh} disabled={loading} className="gap-2 rounded-full px-5 shadow-lg shadow-[var(--primary)]/20 hover:shadow-xl hover:scale-105 transition-all">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            <span className="font-semibold">刷新简报</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={onImportDigest} disabled={importingDigest || stats.total === 0} className="gap-2 rounded-full px-5 backdrop-blur-md bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition-all border border-black/5 dark:border-white/10">
            {importingDigest ? <Loader2 size={16} className="animate-spin" /> : <FilePlus2 size={16} />}
            存为笔记
          </Button>
          <Button variant="ghost" size="sm" onClick={onCopySummary} disabled={stats.total === 0} className="gap-2 rounded-full px-5 backdrop-blur-md bg-black/5 dark:bg-black/30 hover:bg-black/10 dark:hover:bg-black/50 transition-all">
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
            {copied ? "已复制" : "复制摘要"}
          </Button>
        </div>
      </motion.div>

      {/* Bento Box Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 auto-rows-min"
      >
        {/* Row 1 */}
        {/* Market Pulse (Span 4) */}
        <motion.div variants={itemAnim} className="md:col-span-4 lg:col-span-4 h-full">
          <SpotlightCard className="h-full p-5 min-h-[160px]">
            <MarketPulseStrip
              markets={markets}
              refreshing={marketRefreshing}
              error={marketError}
              onRefresh={onMarketRefresh}
            />
          </SpotlightCard>
        </motion.div>

        {/* Stats 1: News (Span 2) */}
        <motion.div variants={itemAnim} className="md:col-span-2 lg:col-span-1 h-full">
          <SpotlightCard className="h-full p-5">
            <MiniMetric
              icon={<Newspaper size={14} />}
              label="Information"
              value={stats.total}
              hint={`${stats.unread} Unread Items`}
            />
          </SpotlightCard>
        </motion.div>

        {/* Stats 2: Quality (Span 2) */}
        <motion.div variants={itemAnim} className="md:col-span-2 lg:col-span-1 h-full">
          <SpotlightCard className="h-full p-5">
            <MiniMetric
              icon={<Gauge size={14} />}
              label="Avg Score"
              value={score}
              hint={qualityLabel(score)}
            />
          </SpotlightCard>
        </motion.div>

        {/* Row 2 */}
        {/* Horoscope (Span 4) */}
        <motion.div variants={itemAnim} className="md:col-span-4 lg:col-span-4 h-full">
          <SpotlightCard className="h-full p-5 min-h-[180px]">
             <HoroscopeStrip horoscopes={horoscopes} onSelect={(h, anchor) => setSelectedHoroscope({ horoscope: h, anchor })} />
          </SpotlightCard>
        </motion.div>

        {/* Tags (Span 2) */}
        <motion.div variants={itemAnim} className="md:col-span-4 lg:col-span-2 h-full">
          <SpotlightCard className="h-full p-5 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
              <Tags size={14} className="text-pink-500" />
              Top Tags
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(stats.topTags.length ? stats.topTags : ["Waiting Sync"]).slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg border border-black/5 dark:border-white/10 bg-white/40 dark:bg-black/30 backdrop-blur-md px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] shadow-sm hover:scale-105 transition-transform"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </SpotlightCard>
        </motion.div>
      </motion.div>

      <HoroscopeDetailBubble selected={selectedHoroscope} onClose={() => setSelectedHoroscope(null)} />
    </div>
  );
}
