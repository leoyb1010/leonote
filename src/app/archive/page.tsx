import { AppShell } from "@/components/app-shell";
import { ServerFilterView } from "@/components/server-filter-view";

export default function ArchivePage() {
  return (
    <AppShell title="归档" subtitle="查看已经归档的历史内容。" current="/settings">
      <ServerFilterView type="archived" />
    </AppShell>
  );
}
