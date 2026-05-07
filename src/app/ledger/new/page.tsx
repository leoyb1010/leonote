import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExpenseQuickCapture } from "@/components/ledger/ExpenseQuickCapture";
import { getSessionUserId } from "@/lib/session";
import { listExpenseCategories, toExpenseCategoryDTO } from "@/lib/expense";

export default async function NewExpensePage() {
  const userId = await getSessionUserId();
  const categories = userId ? await listExpenseCategories(userId) : [];

  return (
    <PageContainer width="form">
      <PageHeader title="记一笔" />
      <ExpenseQuickCapture categories={categories.map(toExpenseCategoryDTO)} />
    </PageContainer>
  );
}
