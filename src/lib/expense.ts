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
  return { start, end: now };
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

  const [monthlyGroups, weeklyTotal, recent, categories] = await Promise.all([
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
    prisma.expense.findMany({
      where: { userId, deletedAt: null },
      include: { category: true },
      orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
      take: 10,
    }),
    prisma.expenseCategory.findMany({ where: { userId } }),
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

  return {
    totalAmount,
    weeklyTotal: weeklyTotal._sum.amount ?? 0,
    byCategory,
    recent: recent.map(toExpenseDTO),
  };
}
