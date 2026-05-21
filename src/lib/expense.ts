import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const EXPENSE_COLOR_OPTIONS = [
  "slate",
  "blue",
  "violet",
  "amber",
  "rose",
  "emerald",
  "sky",
] as const;

export type ExpenseColor = (typeof EXPENSE_COLOR_OPTIONS)[number];

type ExpenseWithCategory = Prisma.ExpenseGetPayload<{
  include: { category: true };
}>;

type CategoryWithCount = Prisma.ExpenseCategoryGetPayload<{
  include: { _count: { select: { expenses: true } } };
}>;

export function toExpenseCategoryDTO(category: CategoryWithCount | Prisma.ExpenseCategoryGetPayload<Record<string, never>>) {
  return {
    id: category.id,
    name: category.name,
    emoji: category.emoji,
    color: category.color as string,
    isArchived: category.isArchived,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
    expenseCount: "_count" in category ? category._count.expenses : undefined,
  };
}

export function toExpenseDTO(expense: ExpenseWithCategory) {
  return {
    id: expense.id,
    amount: expense.amount,
    currency: expense.currency,
    note: expense.note,
    occurredAt: expense.occurredAt.toISOString(),
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
    categoryId: expense.categoryId,
    category: expense.category
      ? {
          id: expense.category.id,
          name: expense.category.name,
          emoji: expense.category.emoji,
          color: expense.category.color as string,
          isArchived: expense.category.isArchived,
        }
      : null,
  };
}

export async function requireOwnedExpense(id: string, userId: string) {
  return prisma.expense.findFirst({
    where: { id, userId, deletedAt: null },
    include: { category: true },
  });
}

export async function requireOwnedCategory(id: string, userId: string) {
  return prisma.expenseCategory.findFirst({
    where: { id, userId },
  });
}

export async function listExpenseCategories(userId: string, options?: { includeArchived?: boolean }) {
  return prisma.expenseCategory.findMany({
    where: {
      userId,
      isArchived: options?.includeArchived ? undefined : false,
    },
    include: { _count: { select: { expenses: true } } },
    orderBy: [{ isArchived: "asc" }, { sortOrder: "asc" }, { updatedAt: "desc" }],
  });
}

export async function listExpenses(
  userId: string,
  options?: {
    categoryId?: string | null;
    from?: Date;
    to?: Date;
    take?: number;
  },
) {
  return prisma.expense.findMany({
    where: {
      userId,
      deletedAt: null,
      categoryId: options?.categoryId ?? undefined,
      occurredAt: {
        gte: options?.from,
        lte: options?.to,
      },
    },
    include: { category: true },
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take: Math.min(Math.max(options?.take ?? 50, 1), 200),
  });
}

export function getMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  // NOTE: `end: now` returns the current moment, NOT the last day of the month.
  // This is intentional: the monthly summary uses this for month-to-date aggregates
  // (monthlyGroups, weekly) while daily-row queries use `monthEnd` (last day
  // 23:59:59.999) for full-month coverage. See `getExpenseSummary`.
  return { start, end: now };
}

function getPreviousMonthComparableRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  start.setHours(0, 0, 0, 0);

  const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  const endDay = Math.min(now.getDate(), lastDay);
  const end = new Date(now.getFullYear(), now.getMonth() - 1, endDay);
  end.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

  return { start, end };
}

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getWeekRange(now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  return { start, end: now };
}

export async function getExpenseSummary(userId: string, now = new Date()) {
  const month = getMonthRange(now);
  const week = getWeekRange(now);
  const previousMonth = getPreviousMonthComparableRange(now);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  const [monthlyGroups, weeklyTotal, previousTotal, recent, categories, topExpense, dailyRows] = await Promise.all([
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        deletedAt: null,
        occurredAt: { gte: month.start, lte: month.end },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.expense.aggregate({
      where: {
        userId,
        deletedAt: null,
        occurredAt: { gte: week.start, lte: week.end },
      },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: {
        userId,
        deletedAt: null,
        occurredAt: { gte: previousMonth.start, lte: previousMonth.end },
      },
      _sum: { amount: true },
    }),
    prisma.expense.findMany({
      where: { userId, deletedAt: null },
      include: { category: true },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      take: 10,
    }),
    prisma.expenseCategory.findMany({ where: { userId } }),
    prisma.expense.findFirst({
      where: {
        userId,
        deletedAt: null,
        occurredAt: { gte: month.start, lte: month.end },
      },
      include: { category: true },
      orderBy: [{ amount: "desc" }, { occurredAt: "desc" }],
    }),
    prisma.$queryRaw<Array<{ d: string; total: number | bigint | null }>>`
      SELECT date(occurredAt) as d, SUM(amount) as total
      FROM Expense
      WHERE userId = ${userId}
        AND deletedAt IS NULL
        AND occurredAt >= ${month.start}
        AND occurredAt <= ${monthEnd}
      GROUP BY date(occurredAt)
    `,
  ]);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const byCategory = monthlyGroups
    .map((group) => {
      const category = group.categoryId ? categoryMap.get(group.categoryId) : null;
      return {
        categoryId: group.categoryId,
        name: category?.name ?? "未分类",
        emoji: category?.emoji ?? "💰",
        color: category?.color ?? "slate",
        total: group._sum.amount ?? 0,
        count: group._count.id,
      };
    })
    .sort((a, b) => b.total - a.total);

  const totalAmount = byCategory.reduce((sum, item) => sum + item.total, 0);
  const dailyMap = new Map(dailyRows.map((row) => [row.d, Number(row.total ?? 0)]));
  const daysInMonth = monthEnd.getDate();
  const elapsedDays = Math.max(1, now.getDate());
  const daily = Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), index + 1);
    const key = formatDateKey(date);
    return { date: key, total: dailyMap.get(key) ?? 0 };
  });
  const previous = previousTotal._sum.amount ?? 0;
  const deltaPct = previous > 0 ? ((totalAmount - previous) / previous) * 100 : null;
  const averageDaily = Math.round(totalAmount / elapsedDays);
  const forecastMonth = Math.round(averageDaily * daysInMonth);

  return {
    totalAmount,
    weeklyTotal: weeklyTotal._sum.amount ?? 0,
    byCategory,
    recent: recent.map(toExpenseDTO),
    daily,
    monthOverMonth: {
      current: totalAmount,
      previous,
      deltaPct,
    },
    topExpense: topExpense ? toExpenseDTO(topExpense) : null,
    averageDaily,
    forecastMonth,
  };
}
