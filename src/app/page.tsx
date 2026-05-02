import { getSessionUserId } from "@/lib/session";
import { getHomeViewData } from "@/lib/view-models";
import { TodayPage } from "@/components/pages/TodayPage";

export default async function HomePage() {
  const userId = await getSessionUserId();
  const data = userId ? await getHomeViewData(userId) : null;

  return <TodayPage data={data} signedIn={Boolean(userId)} />;
}
