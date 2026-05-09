"use client";

import { motion } from "framer-motion";
import { Activity, AlertCircle, ArrowDownRight, ArrowUpRight, Clock3, Droplets, RefreshCw } from "lucide-react";
import { MarketSparkline } from "./MarketSparkline";
import { cardFloatIn } from "@/lib/animations";
import { marketCategoryLabel } from "@/lib/briefing/display";
import type { MarketSnapshotDTO, WeatherDTO } from "@/lib/briefing/types";

const WEATHER_ICON: Record<number, string> = { 0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 51: "🌧️", 61: "🌧️", 71: "❄️", 80: "🌦️", 95: "⛈️" };

interface Props {
  markets: MarketSnapshotDTO[];
  weather: WeatherDTO | null;
  dateLabel: string;
  refreshing?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

function fmtPrice(item: MarketSnapshotDTO): string {
  const v = item.price;
  if (v === 0) return "0";
  // 大于等于 10 的指数/价格，显示整数且不带千分位分隔符
  if (v >= 10) return Math.floor(v).toString();
  // 汇率或极小值保留 4 位
  if (item.category === "fx" || v < 1) return v.toFixed(4);
  return v.toFixed(2);
}

function formatCapturedAt(markets: MarketSnapshotDTO[]) {
  const latest = latestMarketTime(markets);
  if (!latest) return "等待数据";
  return latest.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function latestMarketTime(markets: MarketSnapshotDTO[]) {
  const latest = markets.reduce<Date | null>((acc, item) => {
    const current = new Date(item.capturedAt);
    return !acc || current > acc ? current : acc;
  }, null);
  return latest;
}

function freshness(markets: MarketSnapshotDTO[]) {
  const latest = latestMarketTime(markets);
  if (!latest) return { label: "等待同步", tone: "idle" as const };

  const ageMinutes = Math.max(0, Math.floor((Date.now() - latest.getTime()) / 60_000));
  if (ageMinutes < 1) return { label: "刚刚同步", tone: "fresh" as const };
  if (ageMinutes <= 5) return { label: `${ageMinutes} 分钟前`, tone: "fresh" as const };
  if (ageMinutes <= 30) return { label: `${ageMinutes} 分钟前`, tone: "warm" as const };
  return { label: `${ageMinutes} 分钟前`, tone: "stale" as const };
}

function rankMarkets(markets: MarketSnapshotDTO[]) {
  const categoryOrder = ["index_cn", "index_global", "metal", "crypto", "fx"];
  const symbolOrder = ["sh000001", "sz399001", "hkHSI", "gb_ixic", "hf_XAU", "hf_XAG", "BTC-USD", "ETH-USD", "USD-CNY"];
  return [...markets].sort((a, b) => {
    const aCategoryIndex = categoryOrder.includes(a.category) ? categoryOrder.indexOf(a.category) : categoryOrder.length;
    const bCategoryIndex = categoryOrder.includes(b.category) ? categoryOrder.indexOf(b.category) : categoryOrder.length;
    const categoryDelta = aCategoryIndex - bCategoryIndex;
    if (categoryDelta !== 0) return categoryDelta;
    const aSymbolIndex = symbolOrder.includes(a.symbol) ? symbolOrder.indexOf(a.symbol) : symbolOrder.length;
    const bSymbolIndex = symbolOrder.includes(b.symbol) ? symbolOrder.indexOf(b.symbol) : symbolOrder.length;
    return aSymbolIndex - bSymbolIndex;
  });
}

function MarketTile({ item }: { item: MarketSnapshotDTO }) {
  const up = item.changePct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const changeAbs = Math.abs(item.changeAbs);
  const absLabel = changeAbs >= 10 ? changeAbs.toFixed(0) : changeAbs < 1 ? changeAbs.toFixed(4) : changeAbs.toFixed(2);
  return (
    <div className="relative min-h-[116px] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-3">
      <div className={`absolute inset-y-3 left-0 w-0.5 rounded-full ${up ? "bg-[var(--success)]" : "bg-[var(--danger)]"}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-[var(--text-muted)]">{item.name}</p>
          <p className="numeric-display mt-1 text-xl font-semibold leading-none text-[var(--text-primary)]">{fmtPrice(item)}</p>
        </div>
        <div className="mt-1 shrink-0">
          <MarketSparkline points={item.points} positive={up} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className={`inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5 text-xs ${up ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--danger-soft)] text-[var(--danger)]"}`}>
          <Icon size={12} />
          {up ? "+" : ""}{item.changePct.toFixed(2)}%
        </div>
        <span className="numeric-display text-[11px] text-[var(--text-muted)]">
          {up ? "+" : "-"}{absLabel}
        </span>
      </div>
    </div>
  );
}

export function TopBar({ markets, weather, dateLabel, refreshing = false, error, onRefresh }: Props) {
  const orderedMarkets = rankMarkets(markets).slice(0, 9);
  const groups = orderedMarkets.reduce<Array<{ category: string; items: MarketSnapshotDTO[] }>>((acc, item) => {
    const group = acc.find((entry) => entry.category === item.category);
    if (group) group.items.push(item);
    else acc.push({ category: item.category, items: [item] });
    return acc;
  }, []);
  const mostMoved = orderedMarkets
    .filter((item) => Number.isFinite(item.changePct))
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0];
  const freshnessState = freshness(markets);
  const freshnessTone = error ? "border-[var(--danger)] text-[var(--danger)] bg-[var(--danger-soft)]" :
    freshnessState.tone === "fresh" ? "border-[var(--success)] text-[var(--success)] bg-[var(--success-soft)]" :
    freshnessState.tone === "warm" ? "border-[var(--warning)] text-[var(--warning)] bg-[var(--warning-soft)]" :
    "border-[var(--hairline)] text-[var(--text-muted)] bg-[var(--material-inset)]";

  return (
    <motion.section variants={cardFloatIn} initial="initial" animate="animate" className="card-premium p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[11px] text-[var(--text-muted)]">{dateLabel}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">实时行情看板</h2>
            <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
              <Activity size={12} />
              {orderedMarkets.length} 项
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {weather && (
            <div className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-1.5">
              <span>{WEATHER_ICON[weather.weatherCode] ?? "🌡️"}</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">深圳 {weather.temp}°</span>
              <span className="text-xs text-[var(--text-muted)]">{weather.weatherLabel}</span>
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]"><Droplets size={12} />{weather.humidity}%</span>
            </div>
          )}
          <div className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs ${freshnessTone}`} title={error ?? undefined}>
            {error ? <AlertCircle size={13} /> : <Clock3 size={13} />}
            {error ? "实时源异常，显示缓存" : freshnessState.label}
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
            <Clock3 size={13} />
            行情 {formatCapturedAt(markets)}
          </div>
          {mostMoved && (
            <div className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
              波动最大：{mostMoved.name}
            </div>
          )}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              title="刷新实时行情"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--text-secondary)] hover:bg-[var(--interactive-hover)] disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              刷新
            </button>
          )}
        </div>
      </div>

      {markets.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-8 text-center text-sm text-[var(--text-muted)]">
          市场数据收集中…
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {groups.map((group) => (
            <section key={group.category} className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-[var(--text-secondary)]">{marketCategoryLabel(group.category)}</p>
                <span className="text-[11px] text-[var(--text-muted)]">{group.items.length}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {group.items.map((item) => <MarketTile key={item.symbol} item={item} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </motion.section>
  );
}
