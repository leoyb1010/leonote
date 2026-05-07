"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/base/EmptyState";
import { Button } from "@/components/base/Button";
import { formatMoney } from "@/lib/format-money";
import { ExpenseQuickCapture } from "@/components/ledger/ExpenseQuickCapture";
import { ExpenseRow } from "@/components/ledger/ExpenseRow";
import { CategoryDistribution } from "@/components/ledger/CategoryDistribution";
import { LedgerDashboard } from "@/components/ledger/LedgerDashboard";
import type { ExpenseCategoryDTO, ExpenseDTO, ExpenseSummaryDTO } from "@/components/ledger/types";

type Props = {
  signedIn: boolean;
  categories: ExpenseCategoryDTO[];
  summary: ExpenseSummaryDTO | null;
};

function buildHeroLine(summary: ExpenseSummaryDTO | null) {
  const top = summary?.byCategory[0];
  const second = summary?.byCategory[1];

  if (!summary || summary.totalAmount === 0) return "给金钱一个不焦虑的位置。";
  if (!top || !second) return `这个月，你为${top?.name ?? "生活"}留下了 ${formatMoney(summary.totalAmount)}。`;

  return `这个月，你为${top.name}投入了 ${formatMoney(top.total)}，为${second.name}留了 ${formatMoney(second.total)}。`;
}

function isSameMonth(value: string, now = new Date()) {
  const date = new Date(value);
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function isSameWeek(value: string, now = new Date()) {
  const date = new Date(value);
  const start = new Date(now);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return date >= start && date <= now;
}

function recalculatePace(summary: ExpenseSummaryDTO, totalAmount: number) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const averageDaily = Math.round(totalAmount / Math.max(1, now.getDate()));
  const previous = summary.monthOverMonth.previous;
  return {
    averageDaily,
    forecastMonth: Math.round(averageDaily * daysInMonth),
    monthOverMonth: {
      ...summary.monthOverMonth,
      current: totalAmount,
      deltaPct: previous > 0 ? ((totalAmount - previous) / previous) * 100 : null,
    },
  };
}

function updateDaily(daily: ExpenseSummaryDTO["daily"], dateValue: string, delta: number) {
  const key = dateValue.slice(0, 10);
  return daily.map((item) =>
    item.date === key ? { ...item, total: Math.max(0, item.total + delta) } : item,
  );
}

export function LedgerPage({ signedIn, categories, summary }: Props) {
  const [recent, setRecent] = useState<ExpenseDTO[]>(summary?.recent ?? []);
  const [localSummary, setLocalSummary] = useState(summary);

  function handleCreated(expense: ExpenseDTO) {
    setRecent((prev) => [expense, ...prev].slice(0, 10));
    setLocalSummary((prev) => {
      if (!prev) return prev;
      const inMonth = isSameMonth(expense.occurredAt);
      const nextTotal = inMonth ? prev.totalAmount + expense.amount : prev.totalAmount;
      return {
        ...prev,
        totalAmount: nextTotal,
        weeklyTotal: prev.weeklyTotal + expense.amount,
        recent: [expense, ...prev.recent].slice(0, 10),
        daily: inMonth ? updateDaily(prev.daily, expense.occurredAt, expense.amount) : prev.daily,
        topExpense: !prev.topExpense || expense.amount > prev.topExpense.amount ? expense : prev.topExpense,
        ...recalculatePace(prev, nextTotal),
      };
    });
  }

  function handleDeleted(expense: ExpenseDTO) {
    setRecent((prev) => prev.filter((item) => item.id !== expense.id));
    setLocalSummary((prev) => {
      if (!prev) return prev;
      const inMonth = isSameMonth(expense.occurredAt);
      const inWeek = isSameWeek(expense.occurredAt);
      const nextTotal = inMonth ? Math.max(0, prev.totalAmount - expense.amount) : prev.totalAmount;
      const byCategory = inMonth
        ? prev.byCategory
            .map((item) => {
              const sameCategory = item.categoryId === expense.categoryId;
              if (!sameCategory) return item;
              return {
                ...item,
                total: Math.max(0, item.total - expense.amount),
                count: Math.max(0, item.count - 1),
              };
            })
            .filter((item) => item.count > 0 && item.total > 0)
        : prev.byCategory;

      return {
        ...prev,
        totalAmount: nextTotal,
        weeklyTotal: inWeek ? Math.max(0, prev.weeklyTotal - expense.amount) : prev.weeklyTotal,
        byCategory,
        recent: prev.recent.filter((item) => item.id !== expense.id),
        daily: inMonth ? updateDaily(prev.daily, expense.occurredAt, -expense.amount) : prev.daily,
        topExpense: prev.topExpense?.id === expense.id ? null : prev.topExpense,
        ...recalculatePace(prev, nextTotal),
      };
    });
  }

  if (!signedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">记账</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">
          登录后，把日常花费轻轻放在这里。
        </p>
        <Link href="/login" className="mt-8"><Button size="lg">进入 Leonote</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="border-b border-[var(--hairline)] pb-6">
        <p className="text-xs tracking-wide text-[var(--text-muted)]">Ledger</p>
        <h1 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
          {buildHeroLine(localSummary)}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          钱花在了让你成为现在这个你的事情上。先记下，不必立刻评判。
        </p>
      </section>

      <ExpenseQuickCapture categories={categories} onCreated={handleCreated} />

      {categories.length === 0 ? (
        <div className="rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-inset)] px-4 py-5">
          <p className="text-sm text-[var(--text-secondary)]">还没有记账类型。第一条可以从 AI 订阅、咖啡、书或健身开始。</p>
          <Link href="/ledger/categories" className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline">
            去放一个类型 <ArrowRight size={12} />
          </Link>
        </div>
      ) : null}

      {localSummary ? <LedgerDashboard summary={{ ...localSummary, recent }} /> : null}
      {localSummary ? <CategoryDistribution summary={{ ...localSummary, recent }} /> : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-[var(--text-secondary)]">最近记录</h2>
          <Link href="/ledger/categories" className="text-xs text-[var(--primary)] hover:underline">管理类型</Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            title="还没有开始记账。"
            description="第一笔可以从今天的咖啡开始。"
          />
        ) : (
          <div className="divide-y divide-[var(--hairline)] rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-1">
            {recent.map((expense) => <ExpenseRow key={expense.id} expense={expense} onDeleted={handleDeleted} />)}
          </div>
        )}
      </section>
    </div>
  );
}
