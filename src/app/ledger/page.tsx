import { PageContainer } from "@/components/layout/PageContainer";
import { LedgerPage } from "@/components/pages/LedgerPage";
import { getSessionUserId } from "@/lib/session";
import { getExpenseSummary, listExpenseCategories, toExpenseCategoryDTO } from "@/lib/expense";

export default async function LedgerRoutePage() {
  const userId = await getSessionUserId();
  const [categories, summary] = userId
    ? await Promise.all([listExpenseCategories(userId), getExpenseSummary(userId)])
    : [[], null] as const;

  return (
    <PageContainer width="dashboard">
      <LedgerPage
        signedIn={Boolean(userId)}
        categories={categories.map(toExpenseCategoryDTO)}
        summary={summary}
      />
    </PageContainer>
  );
}
