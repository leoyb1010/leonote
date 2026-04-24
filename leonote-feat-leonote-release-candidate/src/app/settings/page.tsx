import Link from "next/link";
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
      <section className="glass-panel animate-rise mb-5 rounded-[28px] p-5">
        <div className="text-sm text-[#666]">当前身份</div>
        <div className="mt-2 text-xl font-semibold">Leonote 用户</div>
        <div className="mt-2 text-sm text-[#888]">单人模式 · 中文界面 · Web First</div>
      </section>
      <section className="space-y-3">
        {settings.map((item, index) => (
          <Link key={item.label} href={item.href} className="glass-panel animate-rise block rounded-[24px] px-4 py-4 text-sm text-[#333] transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)]" style={{ animationDelay: `${index * 50}ms` }}>
            {item.label}
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
