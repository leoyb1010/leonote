"use client";

import { LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("输入账号信息后进入 Leonote。");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mode === "login" ? { email, password } : { name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.message || (mode === "login" ? "登录失败" : "注册失败"));
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
  };

  return (
    <GlassPanel blur="xl" glow="brand" className="w-full max-w-md rounded-[32px] p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-white/45">Leonote</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{mode === "login" ? "欢迎回来" : "创建首个账号"}</h1>
      <p className="mt-2 text-sm leading-7 text-white/58">{mode === "login" ? "登录后继续记录、整理与回顾。" : "当前版本仅允许创建首个账号。"}</p>
      <div className="mt-6 space-y-3">
        {mode === "register" ? <input value={name} onChange={(e) => setName(e.target.value)} placeholder="输入昵称" className="w-full rounded-[20px] border border-white/8 bg-[rgba(8,11,18,0.56)] px-4 py-4 text-sm text-white outline-none placeholder:text-white/26" /> : null}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="输入邮箱" className="w-full rounded-[20px] border border-white/8 bg-[rgba(8,11,18,0.56)] px-4 py-4 text-sm text-white outline-none placeholder:text-white/26" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="输入密码（至少 8 位）" className="w-full rounded-[20px] border border-white/8 bg-[rgba(8,11,18,0.56)] px-4 py-4 text-sm text-white outline-none placeholder:text-white/26" />
      </div>
      <div className="mt-5 flex gap-3">
        <button onClick={() => setMode(mode === "login" ? "register" : "login")} disabled={loading} className="flex-1 rounded-full border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/76" type="button">
          {mode === "login" ? "创建账号" : "返回登录"}
        </button>
        <button onClick={submit} disabled={loading} className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:brightness-110 disabled:opacity-60" type="button">
          {mode === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {loading ? "处理中" : mode === "login" ? "登录" : "注册"}
        </button>
      </div>
      <p className="mt-4 rounded-[18px] border border-white/8 bg-white/5 px-3 py-3 text-center text-xs text-white/56">{message}</p>
    </GlassPanel>
  );
}
