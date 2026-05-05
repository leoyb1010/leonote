"use client";

import Link from "next/link";
import { ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { DataBackupCard } from "@/components/data-backup-card";
import { Card } from "@/components/base/Card";
import { Button } from "@/components/base/Button";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

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
    return () => { active = false; };
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
    if (!res.ok) { setMessage(data.message || "资料更新失败"); return; }
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
    if (!res.ok) { setMessage(data.message || "修改密码失败"); return; }
    setCurrentPassword("");
    setNewPassword("");
    setMessage("密码已更新");
  };

  return (
    <PageContainer width="form">
      <PageHeader title="个人资料与安全" />
      <div className="space-y-6">

      {needLogin ? (
        <Card>
          <p className="text-sm text-[var(--text-secondary)] mb-4">{message}</p>
          <Link href="/login">
            <Button>去登录</Button>
          </Link>
        </Card>
      ) : (
        <>
          {user && (
            <Card>
              <div className="flex items-center gap-2 mb-3 text-sm font-medium text-[var(--text-primary)]">
                <UserRound size={16} className="text-[var(--primary)]" />账号信息
              </div>
              <div className="space-y-1.5 text-sm">
                <p><span className="text-[var(--text-muted)]">邮箱：</span><span className="text-[var(--text-primary)]">{user.email}</span></p>
                <p><span className="text-[var(--text-muted)]">创建时间：</span>{new Date(user.createdAt).toLocaleString("zh-CN")}</p>
                <p><span className="text-[var(--text-muted)]">最近更新：</span>{new Date(user.updatedAt).toLocaleString("zh-CN")}</p>
              </div>
            </Card>
          )}

          <Card>
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-4">修改资料</h2>
            <div className="space-y-3">
              <input
                value={name} onChange={(e) => setName(e.target.value)}
                placeholder="昵称"
                className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)] focus:border-[var(--border-focus)] transition-colors"
              />
              <Button onClick={() => void saveProfile()} loading={saving} variant="primary" size="lg">
                保存资料
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="flex items-center gap-2 text-base font-medium text-[var(--text-primary)] mb-4">
              <ShieldCheck size={16} className="text-[var(--primary)]" />修改密码
            </h2>
            <div className="space-y-3">
              <input
                type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="当前密码"
                className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)] focus:border-[var(--border-focus)] transition-colors"
              />
              <input
                type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新密码（至少 8 位）"
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)] focus:border-[var(--border-focus)] transition-colors"
              />
              <Button onClick={() => void updatePassword()} loading={changingPassword} variant="secondary" size="lg">
                更新密码
              </Button>
            </div>
          </Card>

          {message && (
            <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--primary-soft)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              {message}
            </div>
          )}
          <DataBackupCard />
        </>
      )}
      </div>
    </PageContainer>
  );
}
