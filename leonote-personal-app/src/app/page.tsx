import { AppShell } from "@/components/app-shell";
import { ServerHomeClient } from "@/components/server-home-client";
import { getSessionUserId } from "@/lib/session";
import { getHomeViewData } from "@/lib/view-models";

export default async function HomePage() {
  const userId = await getSessionUserId();
  const data = userId ? await getHomeViewData(userId) : null;

  return (
    <AppShell
      title="个人笔记与轻知识库"
      subtitle="专属Leo的记录空间。"
      current="/"
    >
      <ServerHomeClient data={data} signedIn={Boolean(userId)} />
    </AppShell>
  );
}
