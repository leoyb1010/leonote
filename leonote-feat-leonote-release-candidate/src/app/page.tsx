import { AppShell } from "@/components/app-shell";
import { ServerHomeClient } from "@/components/server-home-client";

export default function HomePage() {
  return (
    <AppShell
      title="个人笔记与轻知识库"
      subtitle="一个为个人长期使用设计的中文记录系统，强调简约、稳定与移动端体验。"
      current="/"
    >
      <ServerHomeClient />
    </AppShell>
  );
}
