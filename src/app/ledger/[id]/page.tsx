import { notFound, redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExpenseDetail } from "@/components/ledger/ExpenseDetail";
import { getSessionUserId } from "@/lib/session";
import { listExpenseCategories, requireOwnedExpense, toExpenseCategoryDTO, toExpenseDTO } from "@/lib/expense";

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { id } = await params;
  const [expense, categories] = await Promise.all([
    requireOwnedExpense(id, userId),
    listExpenseCategories(userId),
  ]);
  if (!expense) notFound();

  const dto = toExpenseDTO(expense);

  return (
    <PageContainer width="form">
      <PageHeader title="这笔记录" />
      <ExpenseDetail expense={dto} categories={categories.map(toExpenseCategoryDTO)} />
    </PageContainer>
  );
}
