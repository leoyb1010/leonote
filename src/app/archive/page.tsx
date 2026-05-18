import { ServerFilterView } from "@/components/server-filter-view";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ArchivePage() {
  return (
    <PageContainer width="dashboard">
      <PageHeader title="归档" />
      <ServerFilterView type="archived" />
    </PageContainer>
  );
}
