import { AppShell } from "@/components/app-shell";
import { AccountCenter } from "@/components/account-center";

export default function SettingsPage() {
  return (
    <AppShell title="我的" subtitle="查看当前账号、退出登录，并进入个人资料与数据入口。" current="/settings">
      <AccountCenter />
    </AppShell>
  );
}
