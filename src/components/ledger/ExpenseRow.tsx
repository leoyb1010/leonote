"use client";

import Link from "next/link";
import { formatRelativeTime } from "@/lib/date";
import { formatMoney } from "@/lib/format-money";
import type { ExpenseDTO } from "./types";

type Props = {
  expense: ExpenseDTO;
  href?: string;
};

export function ExpenseRow({ expense, href }: Props) {
  const category = expense.category;
  const title = expense.note || category?.name || "一笔花费";

  return (
    <Link
      href={href ?? `/ledger/${expense.id}`}
      className="group relative block rounded-[var(--radius-md)] border border-transparent px-3.5 py-3 transition-[background-color,border-color] duration-[var(--duration-quick)] hover:bg-[var(--interactive-hover)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0" aria-hidden>{category?.emoji ?? "💰"}</span>
            <h3 className="truncate text-[15px] font-medium tracking-[-0.01em] text-[var(--text-primary)]">
              {title}
            </h3>
          </div>
          <div className="mt-2 flex min-w-0 items-center gap-2 text-xs text-[var(--text-faint)]">
            <span className="truncate rounded-full bg-[var(--interactive-hover)] px-2 py-0.5 text-[var(--text-secondary)]">
              {category?.name ?? "未分类"}
            </span>
            <time>{formatRelativeTime(expense.occurredAt)}</time>
          </div>
        </div>

        <div className="shrink-0 pt-0.5 text-right text-[15px] font-medium text-[var(--text-primary)] [font-variant-numeric:tabular-nums]">
          {formatMoney(expense.amount, expense.currency)}
        </div>
      </div>
    </Link>
  );
}
