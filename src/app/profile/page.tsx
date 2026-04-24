"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DataBackupCard } from "@/components/data-backup-card";

type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("正在读取个人资料…");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, status: res.status, data })))
      .then(({ ok, status, data }) => {
        if (!active) return;
        if (!ok) {
          if (status === 401) {
            setNeedLogin(true);
            setMessage("当前未登录，请重新登录后查看个人资料。");
          } else {
            setMessage(data.message || "读取失败");
          }
          return;
        }
        setNeedLogin(false);
        setUser(data.user);
        setName(data.user.name);
        setMessage("");
      })
      .catch(() => {
        if (!active) return;
        setMessage("读取失败");
      });
    return () => {
      active = false;
    };
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.message || "资料更新失败");
      return;
    }
    setUser(data.user);
    setName(data.user.name);
    setMessage("资料已更新");
  };

  const updatePassword = async () => {
    setChangingPassword(true);
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setChangingPassword(false);
    if (!res.ok) {
      setMessage(data.message || "修改密码失败");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setMessage("密码已更新");
  };

  return (
    <AppShell title="个人资料与安全" subtitle="查看账号信息、修改昵称，并更新登录密码。" current="/settings">
      {needLogin ? (
        <section className="glass-panel rounded-[24px] p-5 text-sm text-[#666]">
          <div>{message}</div>
          <Link href="/login" className="mt-4 inline-flex rounded-full bg-[#111] px-4 py-2 text-sm text-white transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(17,17,17,0.24)]">去登录</Link>
        </section>
      ) : (
        <>
          <section className="glass-panel mb-4 rounded-[24px] p-5 text-sm leading-7 text-[#555]">
            {user ? (
              <>
                <div><strong>邮箱：</strong>{user.email}</div>
                <div><strong>创建时间：</strong>{new Date(user.createdAt).toLocaleString("zh-CN")}</div>
                <div><strong>最近更新：</strong>{new Date(user.updatedAt).toLocaleString("zh-CN")}</div>
                <div><strong>说明：</strong>当前聚焦单人使用、中文界面与稳定记录。</div>
              </>
            ) : (
              <div>{message}</div>
            )}
          </section>

          <section className="glass-panel mb-4 rounded-[24px] p-5">
            <h2 className="text-base font-medium text-[#111]">修改资料</h2>
            <div className="mt-4 space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="昵称" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm outline-none transition-all duration-300 focus:-translate-y-[1px] focus:bg-white focus:shadow-[0_16px_40px_rgba(0,0,0,0.06)]" />
              <button type="button" onClick={() => void saveProfile()} disabled={saving} className="rounded-full bg-[#111] px-4 py-2 text-sm text-white transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(17,17,17,0.24)] active:scale-[0.98]">{saving ? "保存中" : "保存资料"}</button>
            </div>
          </section>

          <section className="glass-panel mb-4 rounded-[24px] p-5">
            <h2 className="text-base font-medium text-[#111]">修改密码</h2>
            <div className="mt-4 space-y-3">
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="当前密码" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm outline-none transition-all duration-300 focus:-translate-y-[1px] focus:bg-white focus:shadow-[0_16px_40px_rgba(0,0,0,0.06)]" />
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="新密码（至少 8 位）" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm outline-none transition-all duration-300 focus:-translate-y-[1px] focus:bg-white focus:shadow-[0_16px_40px_rgba(0,0,0,0.06)]" />
              <button type="button" onClick={() => void updatePassword()} disabled={changingPassword} className="rounded-full bg-[#111] px-4 py-2 text-sm text-white transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(17,17,17,0.24)] active:scale-[0.98]">{changingPassword ? "更新中" : "更新密码"}</button>
            </div>
          </section>

          {message ? <div className="mb-4 rounded-2xl bg-white px-4 py-3 text-sm text-[#666] shadow-[0_10px_30px_rgba(0,0,0,0.04)]">{message}</div> : null}
          <DataBackupCard />
        </>
      )}
    </AppShell>
  );
}
