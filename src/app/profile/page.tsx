import { AppShell } from "@/components/app-shell";
import { DataBackupCard } from "@/components/data-backup-card";

export default function ProfilePage() {
  return (
    <AppShell title="个人资料" subtitle="管理当前账号、模式与数据策略。" current="/settings">
      <section className="mb-4 rounded-[24px] bg-white p-5 text-sm leading-7 text-[#555]">
        <div><strong>昵称：</strong>Leonote 用户</div>
        <div><strong>模式：</strong>单人模式</div>
        <div><strong>语言：</strong>中文</div>
        <div><strong>说明：</strong>当前聚焦单人使用、中文界面与稳定记录。</div>
      </section>
      <DataBackupCard />
    </AppShell>
  );
}
