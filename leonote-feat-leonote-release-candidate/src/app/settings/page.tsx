import { AppShell } from "@/components/app-shell";

const settings = [
  { label: "个人资料", href: "/profile" },
  { label: "收藏内容", href: "/favorites" },
  { label: "归档内容", href: "/archive" },
  { label: "回收站", href: "/trash" },
  { label: "导入与迁移", href: "/import" },
];

export default function SettingsPage() {
  return (
    <AppShell title="我的" subtitle="管理个人偏好与基础设置。" current="/settings">
      <section className="mb-5 rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        <div className="text-sm text-[#666]">当前身份</div>
        <div className="mt-2 text-xl font-semibold">Leonote 用户</div>
        <div className="mt-2 text-sm text-[#888]">单人模式 · 中文界面 · Web First</div>
      </section>
      <section className="space-y-3">
        {settings.map((item) => (
          <a key={item.label} href={item.href} className="block rounded-[24px] border border-[#e7e4de] bg-white px-4 py-4 text-sm text-[#333]">
            {item.label}
          </a>
        ))}
      </section>
    </AppShell>
  );
}
