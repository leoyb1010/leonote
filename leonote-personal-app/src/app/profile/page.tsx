"use client";

import Link from "next/link";
import { ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { DataBackupCard } from "@/components/data-backup-card";
import { GlassPanel } from "@/components/ui/GlassPanel";

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
        <GlassPanel blur="lg" glow="soft" className="rounded-[24px] p-5 text-sm text-white/62">
          <div>{message}</div>
          <Link href="/login" className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:brightness-110">去登录</Link>
        </GlassPanel>
      ) : (
        <>
          <GlassPanel blur="lg" glow="soft" className="mb-4 rounded-[24px] p-5 text-sm leading-7 text-white/62">
            {user ? (
              <>
                <div className="mb-3 inline-flex items-center gap-2 text-white"><UserRound className="h-4 w-4 text-cyan-300" />账号信息</div>
                <div><strong className="text-white">邮箱：</strong>{user.email}</div>
                <div><strong className="text-white">创建时间：</strong>{new Date(user.createdAt).toLocaleString("zh-CN")}</div>
                <div><strong className="text-white">最近更新：</strong>{new Date(user.updatedAt).toLocaleString("zh-CN")}</div>
                <div><strong className="text-white">说明：</strong>当前聚焦单人使用、中文界面与稳定记录。</div>
              </>
            ) : (
              <div>{message}</div>
            )}
          </GlassPanel>

          <GlassPanel blur="lg" glow="soft" className="mb-4 rounded-[24px] p-5">
            <h2 className="text-base font-medium text-white">修改资料</h2>
            <div className="mt-4 space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="昵称" className="w-full rounded-[20px] border border-white/8 bg-[rgba(8,11,18,0.56)] px-4 py-4 text-sm text-white outline-none placeholder:text-white/26" />
              <button type="button" onClick={() => void saveProfile()} disabled={saving} className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:brightness-110 disabled:opacity-60">{saving ? "保存中" : "保存资料"}</button>
            </div>
          </GlassPanel>

          <GlassPanel blur="lg" glow="soft" className="mb-4 rounded-[24px] p-5">
            <h2 className="inline-flex items-center gap-2 text-base font-medium text-white"><ShieldCheck className="h-4 w-4 text-cyan-300" />修改密码</h2>
            <div className="mt-4 space-y-3">
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="当前密码" className="w-full rounded-[20px] border border-white/8 bg-[rgba(8,11,18,0.56)] px-4 py-4 text-sm text-white outline-none placeholder:text-white/26" />
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="新密码（至少 8 位）" className="w-full rounded-[20px] border border-white/8 bg-[rgba(8,11,18,0.56)] px-4 py-4 text-sm text-white outline-none placeholder:text-white/26" />
              <button type="button" onClick={() => void updatePassword()} disabled={changingPassword} className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:brightness-110 disabled:opacity-60">{changingPassword ? "更新中" : "更新密码"}</button>
            </div>
          </GlassPanel>

          {message ? <div className="mb-4 rounded-[20px] border border-white/8 bg-white/5 px-4 py-3 text-sm text-white/60">{message}</div> : null}
          <DataBackupCard />
        </>
      )}
    </AppShell>
  );
}
