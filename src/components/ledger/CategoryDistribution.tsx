"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatMoney } from "@/lib/format-money";
import type { ExpenseSummaryDTO } from "./types";

export function CategoryDistribution({ summary }: { summary: ExpenseSummaryDTO }) {
  const [expanded, setExpanded] = useState(false);
  if (summary.byCategory.length === 0) return null;

  // 移动端默认只显示前 4 项，超出时给出"展开"按钮；sm 及以上始终全显示
  const mobileLimit = 4;
  const overflow = summary.byCategory.length - mobileLimit;
  const visibleOnMobile = expanded ? summary.byCategory : summary.byCategory.slice(0, mobileLimit);

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">钱去了哪里</h2>
      <div className="space-y-2 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-3 sm:p-4">
        {/* 移动端：截断列表 */}
        <div className="space-y-2 sm:hidden">
          {visibleOnMobile.map((item) => {
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
          {overflow > 0 ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
              {expanded ? "收起" : `还有 ${overflow} 类`}
            </button>
          ) : null}
        </div>
        {/* 桌面端：全列表，保持原行为 */}
        <div className="hidden space-y-2 sm:block">
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
      </div>
    </section>
  );
}
