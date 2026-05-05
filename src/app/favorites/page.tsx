import { MemoryFactsPanel } from "@/components/memory-facts-panel";
import { ServerFilterView } from "@/components/server-filter-view";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

export default function FavoritesPage() {
  return (
    <PageContainer width="default">
      <PageHeader title="收藏与记忆" />
      <div className="space-y-6">
        <MemoryFactsPanel />
        <ServerFilterView type="favorite" />
      </div>
    </PageContainer>
  );
}
