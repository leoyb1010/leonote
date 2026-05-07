"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatMoney } from "@/lib/format-money";
import { formatRelativeTime } from "@/lib/date";
import type { ExpenseSummaryDTO } from "./types";

type Props = {
  summary: ExpenseSummaryDTO;
};

function TrendLine({ daily }: { daily: ExpenseSummaryDTO["daily"] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const width = 320;
  const height = 112;
  const pad = 10;
  const max = Math.max(...daily.map((item) => item.total), 1);

  const points = daily.map((item, index) => {
    const x = daily.length <= 1 ? pad : pad + (index / (daily.length - 1)) * (width - pad * 2);
    const y = height - pad - (item.total / max) * (height - pad * 2);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  const areaPath = `${path} L ${width - pad} ${height - pad} L ${pad} ${height - pad} Z`;
  const activePoint = hovered === null ? null : points[hovered];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full overflow-visible" role="img" aria-label="本月每日支出趋势">
        <defs>
          <linearGradient id="ledgerTrendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-quiet)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--primary-quiet)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#ledgerTrendFill)" />
        <line x1={pad} x2={width - pad} y1={height - pad} y2={height - pad} stroke="var(--hairline)" />
        <line x1={pad} x2={width - pad} y1={height / 2} y2={height / 2} stroke="var(--hairline)" strokeDasharray="3 5" />
        <path d={path} fill="none" stroke="var(--primary-quiet)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        {points.map((point, index) => (
          <circle
            key={point.date}
            cx={point.x}
            cy={point.y}
            r="10"
            fill="transparent"
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        {activePoint ? (
          <>
            <circle cx={activePoint.x} cy={activePoint.y} r="4" fill="var(--primary-quiet)" />
            <line x1={activePoint.x} x2={activePoint.x} y1={activePoint.y} y2={height - pad} stroke="var(--primary-quiet)" strokeOpacity="0.25" />
          </>
        ) : null}
      </svg>
      {activePoint ? (
        <div className="pointer-events-none absolute right-1 top-1 rounded-xl border border-[var(--hairline)] bg-[var(--material-elevated)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] shadow-[var(--shadow-sm)]">
          {activePoint.date.slice(5)} · {formatMoney(activePoint.total)}
        </div>
      ) : null}
    </div>
  );
}

export function LedgerDashboard({ summary }: Props) {
  const delta = summary.monthOverMonth.deltaPct;
  const deltaText = delta === null ? "上月暂无可比数据" : `较上月 ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
  const DeltaIcon = (delta ?? 0) >= 0 ? ArrowUpRight : ArrowDownRight;
  const deltaClass = (delta ?? 0) >= 0 ? "text-[var(--danger)]" : "text-[var(--success)]";
  const quietLine = useMemo(() => {
    if (summary.forecastMonth === 0) return "这个月还很安静。";
    return `按这个节奏，月底约 ${formatMoney(summary.forecastMonth)}。`;
  }, [summary.forecastMonth]);

  return (
    <section>
      <h2 className="mb-4 text-sm font-medium text-[var(--text-secondary)]">本月看板</h2>
      <div className="grid gap-3 md:grid-cols-2 3xl:grid-cols-4">
        <div className="card-premium p-4 sm:p-5">
          <p className="text-xs text-[var(--text-muted)]">本月支出</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--text-primary)] numeric-display">
            {formatMoney(summary.totalAmount)}
          </p>
          <p className={`mt-3 inline-flex items-center gap-1 text-xs ${delta === null ? "text-[var(--text-muted)]" : deltaClass}`}>
            {delta !== null ? <DeltaIcon size={13} /> : null}
            {deltaText}
          </p>
        </div>

        <div className="card-premium p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-[var(--text-muted)]">每日趋势</p>
            <span className="text-xs text-[var(--text-faint)]">本月</span>
          </div>
          <TrendLine daily={summary.daily} />
        </div>

        <div className="card-premium p-4 sm:p-5">
          <p className="text-xs text-[var(--text-muted)]">最大一笔</p>
          {summary.topExpense ? (
            <Link href={`/ledger/${summary.topExpense.id}`} className="mt-3 block rounded-2xl transition-colors hover:bg-[var(--interactive-hover)]">
              <p className="text-2xl font-semibold text-[var(--text-primary)] numeric-display">
                {formatMoney(summary.topExpense.amount, summary.topExpense.currency)}
              </p>
              <p className="mt-2 truncate text-sm text-[var(--text-secondary)]">
                {summary.topExpense.category?.emoji ?? "💰"} {summary.topExpense.note || summary.topExpense.category?.name || "一笔花费"}
              </p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">{formatRelativeTime(summary.topExpense.occurredAt)}</p>
            </Link>
          ) : (
            <p className="mt-5 text-sm leading-6 text-[var(--text-muted)]">还没有哪一笔需要被特别看见。</p>
          )}
        </div>

        <div className="card-premium p-4 sm:p-5">
          <p className="text-xs text-[var(--text-muted)]">日均 / 预测</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)] numeric-display">
            {formatMoney(summary.averageDaily)}
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{quietLine}</p>
        </div>
      </div>
    </section>
  );
}
