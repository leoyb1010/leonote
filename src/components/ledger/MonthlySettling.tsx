"use client";

import Link from "next/link";
import { ArrowRight, WalletCards } from "lucide-react";
import { formatMoney } from "@/lib/format-money";
import type { ExpenseSummaryDTO } from "./types";

function buildSummaryLine(summary: ExpenseSummaryDTO) {
  const top = summary.byCategory[0];
  const second = summary.byCategory[1];

  if (!top) return "这个月才刚开始记，慢慢来。";
  if (!second) return `这个月，你为${top.name}留下了 ${formatMoney(top.total)}。`;

  return `这个月，你为${top.name}投入了 ${formatMoney(top.total)}，也为${second.name}留下了 ${formatMoney(second.total)}。`;
}

export function MonthlySettling({ summary }: { summary: ExpenseSummaryDTO }) {
  return (
    <section className="rounded-2xl border border-[var(--hairline)] bg-[var(--material-inset)] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <WalletCards size={16} className="text-[var(--text-muted)]" />
          <span className="text-xs font-medium text-[var(--text-muted)]">本月花费</span>
        </div>
        <Link href="/ledger" className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline">
          看一眼 <ArrowRight size={12} />
        </Link>
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        {buildSummaryLine(summary)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-[var(--text-muted)]">本月</p>
          <p className="mt-1 font-medium text-[var(--text-primary)] [font-variant-numeric:tabular-nums]">
            {formatMoney(summary.totalAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--text-muted)]">本周</p>
          <p className="mt-1 font-medium text-[var(--text-primary)] [font-variant-numeric:tabular-nums]">
            {formatMoney(summary.weeklyTotal)}
          </p>
        </div>
      </div>
    </section>
  );
}
