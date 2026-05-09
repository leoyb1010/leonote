"use client";

import { motion } from "framer-motion";
import { Activity, AlertCircle, ArrowDownRight, ArrowUpRight, Clock3, RefreshCw } from "lucide-react";
import { MarketSparkline } from "./MarketSparkline";
import { cardFloatIn } from "@/lib/animations";
import { marketCategoryLabel } from "@/lib/briefing/display";
import type { MarketSnapshotDTO } from "@/lib/briefing/types";

interface Props {
  markets: MarketSnapshotDTO[];
  refreshing?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

function fmtPrice(item: MarketSnapshotDTO): string {
  const v = item.price;
  if (v === 0) return "0";
  if (v >= 1000) return v.toLocaleString("zh-CN", { maximumFractionDigits: 0 });
  if (item.category === "fx" || v < 1) return v.toFixed(4);
  return v.toFixed(2);
}

function latestMarketTime(markets: MarketSnapshotDTO[]) {
  return markets.reduce<Date | null>((acc, item) => {
    const current = new Date(item.capturedAt);
    return !acc || current > acc ? current : acc;
  }, null);
}

function formatCapturedAt(markets: MarketSnapshotDTO[]) {
  const latest = latestMarketTime(markets);
  if (!latest) return "等待同步";
  return latest.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function freshness(markets: MarketSnapshotDTO[]) {
  const latest = latestMarketTime(markets);
  if (!latest) return "等待同步";
  const ageMinutes = Math.max(0, Math.floor((Date.now() - latest.getTime()) / 60_000));
  if (ageMinutes < 1) return "刚刚同步";
  if (ageMinutes <= 90) return `${ageMinutes} 分钟前`;
  return "缓存行情";
}

function rankMarkets(markets: MarketSnapshotDTO[]) {
  const categoryOrder = ["index_cn", "index_global", "metal", "crypto", "fx"];
  const symbolOrder = ["sh000001", "sz399001", "hkHSI", "gb_ixic", "hf_XAU", "hf_XAG", "BTC-USD", "ETH-USD", "USD-CNY"];
  return [...markets].sort((a, b) => {
    const aCategoryIndex = categoryOrder.includes(a.category) ? categoryOrder.indexOf(a.category) : categoryOrder.length;
    const bCategoryIndex = categoryOrder.includes(b.category) ? categoryOrder.indexOf(b.category) : categoryOrder.length;
    if (aCategoryIndex !== bCategoryIndex) return aCategoryIndex - bCategoryIndex;
    const aSymbolIndex = symbolOrder.includes(a.symbol) ? symbolOrder.indexOf(a.symbol) : symbolOrder.length;
    const bSymbolIndex = symbolOrder.includes(b.symbol) ? symbolOrder.indexOf(b.symbol) : symbolOrder.length;
    return aSymbolIndex - bSymbolIndex;
  });
}

function MarketRow({ item }: { item: MarketSnapshotDTO }) {
  const up = item.changePct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_72px_82px] items-center gap-3 border-b border-[var(--hairline)] py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">{item.name}</p>
        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{marketCategoryLabel(item.category)}</p>
      </div>
      <div className="justify-self-center">
        <MarketSparkline points={item.points} positive={up} />
      </div>
      <div className="text-right">
        <p className="numeric-display text-sm font-semibold text-[var(--text-primary)]">{fmtPrice(item)}</p>
        <p className={`mt-0.5 inline-flex items-center justify-end gap-0.5 text-[11px] ${up ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
          <Icon size={11} />
          {up ? "+" : ""}{item.changePct.toFixed(2)}%
        </p>
      </div>
    </div>
  );
}

export function TopBar({ markets, refreshing = false, error, onRefresh }: Props) {
  const orderedMarkets = rankMarkets(markets).slice(0, 8);
  const mostMoved = orderedMarkets
    .filter((item) => Number.isFinite(item.changePct))
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0];

  return (
    <motion.section variants={cardFloatIn} initial="initial" animate="animate" className="card-premium p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase text-[var(--text-muted)]">
            <Activity size={13} />
            Market
          </div>
          <h2 className="mt-1 text-base font-semibold text-[var(--text-primary)]">市场温度</h2>
        </div>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            title="刷新实时行情"
            className="rounded-lg border border-[var(--hairline)] bg-[var(--material-inset)] p-2 text-[var(--text-muted)] transition-colors hover:border-[var(--hairline-strong)] hover:text-[var(--text-primary)] disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
        ) : null}
      </div>

      <div className="mb-2 flex flex-wrap gap-2 text-[11px] text-[var(--text-muted)]">
        <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2 py-1">
          <Clock3 size={12} />
          {error ? "显示缓存" : freshness(markets)}
        </span>
        <span className="rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2 py-1">
          {formatCapturedAt(markets)}
        </span>
        {mostMoved ? (
          <span className="rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2 py-1">
            波动：{mostMoved.name}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="mb-2 flex items-center gap-1.5 rounded-[var(--radius-lg)] border border-[var(--danger)] bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger)]">
          <AlertCircle size={13} />
          实时源异常，已保留最近缓存。
        </p>
      ) : null}

      {orderedMarkets.length === 0 ? (
        <p className="quiet-inset rounded-[var(--radius-lg)] px-3 py-8 text-center text-sm text-[var(--text-muted)]">
          市场数据收集中…
        </p>
      ) : (
        <div>
          {orderedMarkets.map((item) => <MarketRow key={item.symbol} item={item} />)}
        </div>
      )}
    </motion.section>
  );
}
