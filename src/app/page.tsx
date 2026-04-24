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
      subtitle="一个为个人长期使用设计的中文记录系统，强调简约、稳定、项目制录入与移动端体验。"
      current="/"
    >
      <ServerHomeClient data={data} signedIn={Boolean(userId)} />
    </AppShell>
  );
}
