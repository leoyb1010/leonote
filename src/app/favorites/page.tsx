import { MemoryFactsPanel } from "@/components/memory-facts-panel";
import { ServerFilterView } from "@/components/server-filter-view";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

export default function FavoritesPage() {
  return (
    <PageContainer width="dashboard">
      <PageHeader title="收藏与记忆" />
      <div className="space-y-6">
        {/* MemoryFactsPanel 在移动端隐藏，让收藏列表直接进首屏；可在 /settings 查看 */}
        <div className="hidden sm:block">
          <MemoryFactsPanel />
        </div>
        <ServerFilterView type="favorite" />
      </div>
    </PageContainer>
  );
}
