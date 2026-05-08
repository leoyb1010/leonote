"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Clock3, Droplets } from "lucide-react";
import { MarketSparkline } from "./MarketSparkline";
import { cardFloatIn } from "@/lib/animations";
import { marketCategoryLabel } from "@/lib/briefing/display";
import type { MarketSnapshotDTO, WeatherDTO } from "@/lib/briefing/types";

const WEATHER_ICON: Record<number, string> = { 0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 51: "🌧️", 61: "🌧️", 71: "❄️", 80: "🌦️", 95: "⛈️" };

interface Props {
  markets: MarketSnapshotDTO[];
  weather: WeatherDTO | null;
  dateLabel: string;
}

function fmtPrice(item: MarketSnapshotDTO): string {
  const v = item.price;
  if (item.category === "crypto") return v.toLocaleString("zh-CN", { maximumFractionDigits: 0 });
  if (item.category === "metal") return v.toFixed(1);
  if (item.category === "fx") return v.toFixed(4);
  if (v > 10000) return (v / 10000).toFixed(2) + "万";
  if (v > 1000) return v.toLocaleString("zh-CN", { maximumFractionDigits: 0 });
  return v.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

function formatCapturedAt(markets: MarketSnapshotDTO[]) {
  const latest = markets.reduce<Date | null>((acc, item) => {
    const current = new Date(item.capturedAt);
    return !acc || current > acc ? current : acc;
  }, null);
  if (!latest) return "等待数据";
  return latest.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
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
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-[var(--text-muted)]">{item.name}</p>
          <p className="mt-1 text-lg font-semibold leading-none text-[var(--text-primary)]">{fmtPrice(item)}</p>
        </div>
        <MarketSparkline points={item.points} positive={up} />
      </div>
      <div className={`mt-3 inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5 text-xs ${up ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--danger-soft)] text-[var(--danger)]"}`}>
        <Icon size={12} />
        {up ? "+" : ""}{item.changePct.toFixed(2)}%
      </div>
    </div>
  );
}

export function TopBar({ markets, weather, dateLabel }: Props) {
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

  return (
    <motion.section variants={cardFloatIn} initial="initial" animate="animate" className="card-premium p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] text-[var(--text-muted)]">{dateLabel}</p>
          <h2 className="mt-1 text-base font-semibold text-[var(--text-primary)]">每日看板</h2>
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
          <div className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
            <Clock3 size={13} />
            行情 {formatCapturedAt(markets)}
          </div>
          {mostMoved && (
            <div className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
              波动最大：{mostMoved.name}
            </div>
          )}
        </div>
      </div>

      {markets.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-8 text-center text-sm text-[var(--text-muted)]">
          市场数据收集中…
        </p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-5">
          {groups.map((group) => (
            <section key={group.category} className="min-w-0">
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
