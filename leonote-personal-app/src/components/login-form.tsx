"use client";

import { LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("输入账号信息后进入 Leonote。");
  const [loading, setLoading] = useState(false);

  const submit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (loading) return;

    const normalizedIdentifier = identifier.trim();
    const normalizedRegisterEmail = registerEmail.trim().toLowerCase();
    if (mode === "register" && !name.trim()) {
      setMessage("请先输入昵称。");
      return;
    }
    if (mode === "login" && !normalizedIdentifier) {
      setMessage("请先输入邮箱或用户名。");
      return;
    }
    if (mode === "register" && (!normalizedRegisterEmail || !normalizedRegisterEmail.includes("@"))) {
      setMessage("请先输入有效邮箱。");
      return;
    }
    if (password.length < 8) {
      setMessage("密码至少需要 8 位。");
      return;
    }

    setLoading(true);
    setMessage(mode === "login" ? "正在登录..." : "正在创建账号...");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "login" ? { identifier: normalizedIdentifier, password } : { name: name.trim(), email: normalizedRegisterEmail, password }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({ message: "" }));
      if (!res.ok) {
        setMessage(data.message || (mode === "login" ? "登录失败，请检查邮箱和密码。" : "注册失败，请稍后再试。"));
        return;
      }

      if (mode === "register") {
        setMode("login");
        setMessage("首个账号创建成功，请直接登录。");
        return;
      }

      setMessage("登录成功，正在进入 Leonote。");
      router.push("/");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof DOMException && error.name === "AbortError" ? "请求超时，请确认服务器地址可访问。" : "网络请求失败，请确认 Leonote 服务正在运行。");
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <GlassPanel blur="xl" glow="brand" className="w-full max-w-md rounded-[32px] p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)">Leonote</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{mode === "login" ? "欢迎回来" : "创建首个账号"}</h1>
      <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{mode === "login" ? "登录后继续记录、整理与回顾。" : "当前版本仅允许创建首个账号。"}</p>
      <form onSubmit={submit}>
        <div className="mt-6 space-y-3">
          {mode === "register" ? <input value={name} onChange={(e) => setName(e.target.value)} placeholder="输入昵称" autoComplete="name" className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-4 text-sm text-white outline-none placeholder:text-[var(--text-placeholder)" /> : null}
          {mode === "login" ? (
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" placeholder="输入邮箱或用户名" className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-4 text-sm text-white outline-none placeholder:text-[var(--text-placeholder)" />
          ) : (
            <input value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" placeholder="输入邮箱" className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-4 text-sm text-white outline-none placeholder:text-[var(--text-placeholder)" />
          )}
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="输入密码（至少 8 位）" className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-4 text-sm text-white outline-none placeholder:text-[var(--text-placeholder)" />
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setMode(mode === "login" ? "register" : "login")} disabled={loading} className="flex-1 rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-4 py-3 text-sm text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-60" type="button">
            {mode === "login" ? "创建账号" : "返回登录"}
          </button>
          <button disabled={loading} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60" type="submit">
            {mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {loading ? "处理中..." : mode === "login" ? "登录" : "注册"}
          </button>
        </div>
      </form>
      <p className="mt-4 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[rgba(255,255,255,0.05)] px-3 py-3 text-center text-xs text-[var(--text-muted)]">{message}</p>
    </GlassPanel>
  );
}
