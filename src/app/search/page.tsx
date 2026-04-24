import { AppShell } from "@/components/app-shell";
import { ServerSearchView } from "@/components/server-search-view";

export default function SearchPage() {
  return (
    <AppShell title="搜索" subtitle="按标题、摘要或标签查找你的笔记。" current="/search">
      <ServerSearchView />
    </AppShell>
  );
}
