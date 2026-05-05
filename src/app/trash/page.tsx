import { ServerFilterView } from "@/components/server-filter-view";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

export default function TrashPage() {
  return (
    <PageContainer width="default">
      <PageHeader title="回收站" />
      <ServerFilterView type="deleted" />
    </PageContainer>
  );
}
