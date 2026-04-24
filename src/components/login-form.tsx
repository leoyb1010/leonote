"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <section className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-[0_12px_36px_rgba(0,0,0,0.05)]">
      <p className="text-xs tracking-[0.2em] text-[#666] uppercase">Leonote</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#111]">{mode === "login" ? "欢迎回来" : "创建首个账号"}</h1>
      <p className="mt-2 text-sm leading-6 text-[#666]">{mode === "login" ? "登录后继续记录、整理与回顾。" : "当前版本仅允许创建首个账号。"}</p>
      <div className="mt-6 space-y-3">
        {mode === "register" ? <input value={name} onChange={(e) => setName(e.target.value)} placeholder="输入昵称" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm outline-none" /> : null}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="输入邮箱" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm outline-none" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="输入密码（至少 8 位）" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm outline-none" />
      </div>
      <div className="mt-5 flex gap-3">
        <button onClick={() => setMode(mode === "login" ? "register" : "login")} disabled={loading} className="flex-1 rounded-full border border-[#ddd7cf] px-4 py-3 text-sm text-[#444]" type="button">
          {mode === "login" ? "创建账号" : "返回登录"}
        </button>
        <button onClick={submit} disabled={loading} className="flex-1 rounded-full bg-[#111] px-4 py-3 text-sm text-white" type="button">
          {loading ? "处理中" : mode === "login" ? "登录" : "注册"}
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-[#999]">{message}</p>
    </section>
  );
}
