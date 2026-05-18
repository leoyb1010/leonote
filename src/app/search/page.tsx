import { ServerSearchView } from "@/components/server-search-view";
import { PageContainer } from "@/components/layout/PageContainer";

export default function SearchPage() {
  return (
    <PageContainer width="dashboard">
      <ServerSearchView />
    </PageContainer>
  );
}
