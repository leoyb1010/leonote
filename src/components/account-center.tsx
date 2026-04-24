"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
          if (status === 401) {
            setNeedLogin(true);
            setMessage("当前未登录，请重新登录后查看账号中心。");
          } else {
            setMessage(data.message || "读取账号信息失败");
          }
          return;
        }
        setNeedLogin(false);
        setUser(data.user);
        setMessage("");
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setMessage("读取账号信息失败");
      });
    return () => {
      active = false;
    };
  }, []);

  const logout = async () => {
    setLoading(true);
    const res = await fetch("/api/auth/logout", { method: "POST" });
    setLoading(false);
    if (res.ok) window.location.href = "/login";
  };

  return (
    <>
      <section className="glass-panel animate-rise mb-5 rounded-[28px] p-5">
        <div className="text-sm text-[#666]">账号中心</div>
        {user ? (
          <>
            <div className="mt-2 text-xl font-semibold">{user.name}</div>
            <div className="mt-2 text-sm text-[#666]">邮箱：{user.email}</div>
            <div className="mt-1 text-sm text-[#888]">创建时间：{new Date(user.createdAt).toLocaleString("zh-CN")}</div>
            <div className="mt-1 text-sm text-[#888]">最近更新：{new Date(user.updatedAt).toLocaleString("zh-CN")}</div>
            <div className="mt-1 text-sm text-[#888]">模式：单人模式 · 中文界面 · Web First</div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-[#f7f7f5] px-4 py-3"><div className="text-xs text-[#888]">账号状态</div><div className="mt-1 text-sm font-medium text-[#111]">正常</div></div>
              <div className="rounded-2xl bg-[#f7f7f5] px-4 py-3"><div className="text-xs text-[#888]">登录方式</div><div className="mt-1 text-sm font-medium text-[#111]">邮箱 + 密码</div></div>
              <div className="rounded-2xl bg-[#f7f7f5] px-4 py-3"><div className="text-xs text-[#888]">数据模式</div><div className="mt-1 text-sm font-medium text-[#111]">本地单人</div></div>
              <div className="rounded-2xl bg-[#f7f7f5] px-4 py-3"><div className="text-xs text-[#888]">安全</div><div className="mt-1 text-sm font-medium text-[#111]">签名会话</div></div>
            </div>
            <div className="mt-4 flex gap-3">
              <Link href="/profile" className="rounded-full bg-[#f3f2ef] px-4 py-2 text-sm text-[#333] transition-all duration-300 hover:-translate-y-[1px] hover:bg-[#ebe8e1] active:scale-[0.98]">管理资料</Link>
              <button type="button" onClick={() => void logout()} disabled={loading} className="rounded-full bg-[#111] px-4 py-2 text-sm text-white transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(17,17,17,0.24)] active:scale-[0.98]">{loading ? "退出中" : "退出登录"}</button>
            </div>
          </>
        ) : (
          <div className="mt-3 rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm text-[#666]">
            <div>{message}</div>
            {needLogin ? <Link href="/login" className="mt-3 inline-flex rounded-full bg-[#111] px-4 py-2 text-sm text-white transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(17,17,17,0.24)]">去登录</Link> : null}
          </div>
        )}
      </section>
      {!needLogin ? (
        <section className="space-y-3">
          {items.map((item, index) => (
            <Link key={item.label} href={item.href} className="glass-panel animate-rise block rounded-[24px] px-4 py-4 text-sm text-[#333] transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)]" style={{ animationDelay: `${index * 50}ms` }}>
              {item.label}
            </Link>
          ))}
        </section>
      ) : null}
    </>
  );
}
