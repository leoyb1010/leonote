import { AppShell } from "@/components/app-shell";
import { ServerFilterView } from "@/components/server-filter-view";

export default function TrashPage() {
  return (
    <AppShell title="回收站" subtitle="查看已删除内容，并可按需恢复。" current="/settings">
      <ServerFilterView type="deleted" />
    </AppShell>
  );
}
