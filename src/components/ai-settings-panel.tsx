"use client";

import { useEffect, useState } from "react";

type SettingsShape = {
  baseUrl: string;
  apiKeyMasked: string;
  hasApiKey: boolean;
  model: string;
  fallbackModel: string;
  enableAutoOrganize: boolean;
};

export function AISettingsPanel() {
  const [settings, setSettings] = useState<SettingsShape | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("deepseek-v4-flash");
  const [fallbackModel, setFallbackModel] = useState("deepseek-v4-pro");
  const [enableAutoOrganize, setEnableAutoOrganize] = useState(true);
  const [message, setMessage] = useState("正在读取 AI 配置…");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/ai/settings", { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setMessage(data.message || "读取 AI 配置失败");
          return;
        }
        setSettings(data.settings);
        setBaseUrl(data.settings.baseUrl);
        setModel(data.settings.model);
        setFallbackModel(data.settings.fallbackModel);
        setEnableAutoOrganize(data.settings.enableAutoOrganize);
        setMessage("可直接切换模型或更新接口配置。导入时会自动整理。");
      })
      .catch(() => setMessage("读取 AI 配置失败"));
  }, []);

  const save = async () => {
    setLoading(true);
    const res = await fetch("/api/ai/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseUrl,
        apiKey: apiKey.trim() || undefined,
        model,
        fallbackModel,
        enableAutoOrganize,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.message || "保存失败");
      return;
    }
    setSettings(data.settings);
    setApiKey("");
    setMessage("AI 配置已保存。现在导入和笔记整理会走大模型。\n");
  };

  return (
    <section className="glass-panel animate-rise space-y-4 rounded-[28px] p-5">
      <div>
        <h2 className="text-base font-medium text-[#111]">AI 工作搭子</h2>
        <p className="mt-2 text-sm leading-6 text-[#666]">支持 DeepSeek OpenAI 兼容接口，可切换主模型 / 备用模型，并控制导入自动整理。</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-2 text-sm text-[#555]">
          <span>Base URL</span>
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-3 outline-none" />
        </label>
        <label className="space-y-2 text-sm text-[#555]">
          <span>API Key {settings?.hasApiKey ? `(当前：${settings.apiKeyMasked})` : ""}</span>
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="留空则保持当前" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-3 outline-none" />
        </label>
        <label className="space-y-2 text-sm text-[#555]">
          <span>主模型</span>
          <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-3 outline-none">
            <option value="deepseek-v4-flash">deepseek-v4-flash</option>
            <option value="deepseek-v4-pro">deepseek-v4-pro</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-[#555]">
          <span>备用模型</span>
          <select value={fallbackModel} onChange={(e) => setFallbackModel(e.target.value)} className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-3 outline-none">
            <option value="deepseek-v4-pro">deepseek-v4-pro</option>
            <option value="deepseek-v4-flash">deepseek-v4-flash</option>
          </select>
        </label>
      </div>

      <label className="flex items-center gap-3 rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-[#444]">
        <input type="checkbox" checked={enableAutoOrganize} onChange={(e) => setEnableAutoOrganize(e.target.checked)} />
        导入笔记 / 链接时自动调用 AI 做整理、摘要、标签、项目建议
      </label>

      <div className="flex gap-3">
        <button type="button" onClick={() => void save()} disabled={loading} className="rounded-full bg-[#111] px-5 py-3 text-sm text-white">{loading ? "保存中" : "保存 AI 配置"}</button>
      </div>

      <div className="rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-[#666] whitespace-pre-wrap">{message}</div>
    </section>
  );
}
