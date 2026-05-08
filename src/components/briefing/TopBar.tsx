"use client";

import { motion } from "framer-motion";
import { Droplets, Wind } from "lucide-react";
import { MarketSparkline } from "./MarketSparkline";
import { cardFloatIn } from "@/lib/animations";
import type { MarketSnapshotDTO, WeatherDTO } from "@/lib/briefing/types";

const WEATHER_ICON: Record<number, string> = { 0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 51: "🌧️", 61: "🌧️", 71: "❄️", 80: "🌦️", 95: "⛈️" };

interface Props {
  markets: MarketSnapshotDTO[];
  weather: WeatherDTO | null;
  dateLabel: string;
}

function fmtPrice(item: MarketSnapshotDTO): string {
  const v = item.price;
  if (item.category === "crypto") return "$" + v.toLocaleString("zh-CN", { maximumFractionDigits: 0 });
  if (item.category === "metal") return "$" + v.toFixed(1);
  if (item.category === "fx") return v.toFixed(4);
  if (v > 10000) return (v / 10000).toFixed(2) + "万";
  if (v > 1000) return v.toLocaleString("zh-CN", { maximumFractionDigits: 0 });
  return v.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

export function TopBar({ markets, weather, dateLabel }: Props) {
  const indexCn = markets.filter((m) => m.category === "index_cn");
  const indexGlobal = markets.filter((m) => m.category === "index_global");
  const metals = markets.filter((m) => m.category === "metal");
  const crypto = markets.filter((m) => m.category === "crypto");
  const forex = markets.filter((m) => m.category === "fx");
  const allTickers = [...indexCn, ...indexGlobal, ...metals, ...crypto, ...forex];

  return (
    <motion.section variants={cardFloatIn} initial="initial" animate="animate" className="card-premium p-4 sm:p-5">
      {/* Row 1: Weather + indices */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {weather && (
          <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-1.5 shrink-0">
            <span className="text-lg">{WEATHER_ICON[weather.weatherCode] ?? "🌡️"}</span>
            <div>
              <span className="numeric-display text-base font-semibold text-[var(--text-primary)]">{weather.temp}°</span>
              <span className="text-[11px] text-[var(--text-muted)] ml-1">深圳 {weather.weatherLabel}</span>
            </div>
            <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)] ml-1"><Droplets size={10} />{weather.humidity}%</span>
          </div>
        )}

        {allTickers.map((m) => {
          const up = m.changePct >= 0;
          return (
            <div key={m.symbol} className="flex items-center gap-1.5 rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2.5 py-1.5 shrink-0">
              <div className="min-w-0">
                <p className="text-[10px] text-[var(--text-muted)] leading-tight">{m.name}</p>
                <p className="numeric-display text-[13px] font-semibold text-[var(--text-primary)]">{fmtPrice(m)}</p>
                <p className={`numeric-display text-[10px] ${up ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                  {up ? "+" : ""}{m.changePct.toFixed(2)}%
                </p>
              </div>
              <MarketSparkline points={m.points} positive={up} />
            </div>
          );
        })}

        {/* Date */}
        <div className="ml-auto hidden lg:block shrink-0">
          <p className="numeric-display text-xs text-[var(--text-muted)]">{dateLabel}</p>
        </div>
      </div>

      {/* Empty state */}
      {markets.length === 0 && (
        <p className="text-xs text-[var(--text-muted)] mt-1">市场数据收集中…</p>
      )}
    </motion.section>
  );
}
