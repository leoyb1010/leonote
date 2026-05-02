"use client";

import Link from "next/link";
import { LogOut, Shield, User2 } from "lucide-react";
import { useEffect, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";

type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

const items = [
  { label: "个人资料与安全", href: "/profile" },
  { label: "收藏内容", href: "/favorites" },
  { label: "归档内容", href: "/archive" },
  { label: "回收站", href: "/trash" },
  { label: "导入与迁移", href: "/import" },
];

export function AccountCenter() {
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("正在读取账号信息…");
  const [loading, setLoading] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, status: res.status, data })))
      .then(({ ok, status, data }) => {
        if (!active) return;
        if (!ok) {
          setUser(null);
          if (status === 401) { setNeedLogin(true); setMessage("当前未登录，请重新登录后查看账号中心。"); }
          else { setMessage(data.message || "读取账号信息失败"); }
          return;
        }
        setNeedLogin(false);
        setUser(data.user);
        setMessage("");
      })
      .catch(() => { if (active) { setUser(null); setMessage("读取账号信息失败"); } });
    return () => { active = false; };
  }, []);

  const logout = async () => {
    setLoading(true);
    const res = await fetch("/api/auth/logout", { method: "POST" });
    setLoading(false);
    if (res.ok) window.location.href = "/login";
  };

  return (
    <>
      <GlassPanel blur="xl" glow="soft" className="mb-5 rounded-[var(--radius-lg)] p-5">
        <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Account Center</div>
        {user ? (
          <>
            <div className="mt-3 flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] text-[var(--ai-accent)]"><User2 className="h-5 w-5" /></div>
              <div>
                <div className="text-xl font-semibold text-[var(--text-primary)]">{user.name}</div>
                <div className="mt-1 text-sm text-[var(--text-muted)]">{user.email}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-4 py-3"><div className="text-xs text-[var(--text-muted)]">账号状态</div><div className="mt-1 text-sm font-medium text-[var(--text-primary)]">正常</div></div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-4 py-3"><div className="text-xs text-[var(--text-muted)]">登录方式</div><div className="mt-1 text-sm font-medium text-[var(--text-primary)]">邮箱 + 密码</div></div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-4 py-3"><div className="text-xs text-[var(--text-muted)]">数据模式</div><div className="mt-1 text-sm font-medium text-[var(--text-primary)]">本地单人</div></div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-4 py-3"><div className="text-xs text-[var(--text-muted)]">安全</div><div className="mt-1 text-sm font-medium text-[var(--text-primary)] inline-flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-[var(--ai-accent)]" />签名会话</div></div>
            </div>
            <div className="mt-3 space-y-1 text-sm text-[var(--text-muted)]">
              <div>创建时间：{new Date(user.createdAt).toLocaleString("zh-CN")}</div>
              <div>最近更新：{new Date(user.updatedAt).toLocaleString("zh-CN")}</div>
              <div>模式：单人模式 · 中文界面 · Web First</div>
            </div>
            <div className="mt-4 flex gap-3">
              <Link href="/profile" className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-4 py-2.5 text-sm text-[var(--text-secondary)] transition hover:bg-[rgba(255,255,255,0.08)]">管理资料</Link>
              <button type="button" onClick={() => void logout()} disabled={loading} className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] text-white px-4 py-2.5 text-sm font-medium transition hover:bg-[var(--primary-hover)] disabled:opacity-60"><LogOut className="h-4 w-4" />{loading ? "退出中" : "退出登录"}</button>
            </div>
          </>
        ) : (
          <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[rgba(255,255,255,0.05)] px-4 py-4 text-sm text-[var(--text-muted)]">
            <div>{message}</div>
            {needLogin ? <Link href="/login" className="mt-3 inline-flex rounded-[var(--radius-md)] bg-[var(--primary)] text-white px-4 py-2 text-sm font-medium transition hover:bg-[var(--primary-hover)]">去登录</Link> : null}
          </div>
        )}
      </GlassPanel>
      {!needLogin && (
        <section className="space-y-3">
          {items.map((item) => (
            <Link key={item.label} href={item.href} className="block rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[rgba(255,255,255,0.05)] px-4 py-4 text-sm text-[var(--text-secondary)] transition hover:-translate-y-px hover:bg-[rgba(255,255,255,0.08)]">
              {item.label}
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
