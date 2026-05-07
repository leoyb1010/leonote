export type ExpenseCategoryDTO = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isArchived?: boolean;
  sortOrder?: number;
  expenseCount?: number;
};

export type ExpenseDTO = {
  id: string;
  amount: number;
  currency: string;
  note: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  category: ExpenseCategoryDTO | null;
};

export type ExpenseSummaryDTO = {
  totalAmount: number;
  weeklyTotal: number;
  byCategory: Array<{
    categoryId: string | null;
    name: string;
    emoji: string;
    color: string;
    total: number;
    count: number;
  }>;
  recent: ExpenseDTO[];
  daily: Array<{ date: string; total: number }>;
  monthOverMonth: {
    current: number;
    previous: number;
    deltaPct: number | null;
  };
  topExpense: ExpenseDTO | null;
  averageDaily: number;
  forecastMonth: number;
};
