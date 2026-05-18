import { ServerDailyClient } from "@/components/server-daily-client";
import { PageContainer } from "@/components/layout/PageContainer";

export default function DailyPage() {
  return (
    <PageContainer width="dashboard">
      <ServerDailyClient />
    </PageContainer>
  );
}
