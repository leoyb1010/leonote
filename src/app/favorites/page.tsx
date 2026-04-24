import { AppShell } from "@/components/app-shell";
import { ServerFilterView } from "@/components/server-filter-view";

export default function FavoritesPage() {
  return (
    <AppShell title="收藏" subtitle="查看你标记为收藏的笔记。" current="/settings">
      <ServerFilterView type="favorite" />
    </AppShell>
  );
}
