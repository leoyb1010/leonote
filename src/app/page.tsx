import { getSessionUserId } from "@/lib/session";
import { getHomeViewData } from "@/lib/view-models";
import { TodayPage } from "@/components/pages/TodayPage";
import { PageContainer } from "@/components/layout/PageContainer";

export default async function HomePage() {
  const userId = await getSessionUserId();
  const data = userId ? await getHomeViewData(userId) : null;

  return (
    <PageContainer width="default">
      <TodayPage data={data} signedIn={Boolean(userId)} />
    </PageContainer>
  );
}
