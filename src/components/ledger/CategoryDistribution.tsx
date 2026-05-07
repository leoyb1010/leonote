"use client";

import { formatMoney } from "@/lib/format-money";
import type { ExpenseSummaryDTO } from "./types";

export function CategoryDistribution({ summary }: { summary: ExpenseSummaryDTO }) {
  if (summary.byCategory.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">钱去了哪里</h2>
      <div className="space-y-2 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-4">
        {summary.byCategory.map((item) => {
          const width = summary.totalAmount > 0 ? Math.max((item.total / summary.totalAmount) * 100, 4) : 0;
          return (
            <div key={item.categoryId ?? "uncategorized"} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-[var(--text-secondary)]">
                  <span className="mr-1.5" aria-hidden>{item.emoji}</span>
                  {item.name}
                </span>
                <span className="shrink-0 text-[var(--text-primary)] [font-variant-numeric:tabular-nums]">
                  {formatMoney(item.total)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--interactive-hover)]">
                <div
                  className="h-1.5 rounded-full bg-[var(--accent-calm)] opacity-60"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
