import { PageContainer } from "@/components/layout/PageContainer";
import { LedgerPage } from "@/components/pages/LedgerPage";
import { getSessionUserId } from "@/lib/session";
import { getExpenseSummary, listExpenseCategories, toExpenseCategoryDTO } from "@/lib/expense";
import { getGearSummary, listGearItems, toGearDTO } from "@/lib/gear";

export default async function LedgerRoutePage() {
  const userId = await getSessionUserId();
  const [categories, summary, gearItems, gearSummary] = userId
    ? await Promise.all([
        listExpenseCategories(userId),
        getExpenseSummary(userId),
        listGearItems(userId),
        getGearSummary(userId),
      ])
    : [[], null, [], null] as const;

  return (
    <PageContainer width="dashboard">
      <LedgerPage
        signedIn={Boolean(userId)}
        categories={categories.map(toExpenseCategoryDTO)}
        summary={summary}
        gearItems={gearItems.map(toGearDTO)}
        gearSummary={gearSummary}
      />
    </PageContainer>
  );
}
