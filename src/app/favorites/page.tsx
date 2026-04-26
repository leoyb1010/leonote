import { AppShell } from "@/components/app-shell";
import { MemoryFactsPanel } from "@/components/memory-facts-panel";
import { ServerFilterView } from "@/components/server-filter-view";

export default function FavoritesPage() {
  return (
    <AppShell title="记忆" subtitle="这里同时展示长期记忆与重点收藏内容。让知识沉淀不是冷数据，而是可回想、可追问、可继续推进的事实层。" current="/favorites">
      <div className="space-y-6">
        <MemoryFactsPanel />
        <ServerFilterView type="favorite" />
      </div>
    </AppShell>
  );
}
