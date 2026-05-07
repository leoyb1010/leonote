import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { CategoryManager } from "@/components/ledger/CategoryManager";
import { getSessionUserId } from "@/lib/session";
import { listExpenseCategories, toExpenseCategoryDTO } from "@/lib/expense";

export default async function ExpenseCategoriesPage() {
  const userId = await getSessionUserId();
  const categories = userId ? await listExpenseCategories(userId, { includeArchived: true }) : [];

  return (
    <PageContainer width="form">
      <PageHeader title="记账类型" />
      <CategoryManager initialCategories={categories.map(toExpenseCategoryDTO)} />
    </PageContainer>
  );
}
