import { MemoryFactsPanel } from "@/components/memory-facts-panel";
import { ServerFilterView } from "@/components/server-filter-view";

export default function FavoritesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">收藏与记忆</h1>
      <MemoryFactsPanel />
      <ServerFilterView type="favorite" />
    </div>
  );
}
