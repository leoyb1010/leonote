"use client";

import { useEffect, useState } from "react";

type MemoryItem = {
  id: string;
  type: string;
  content: string;
  confidence: number;
  updatedAt: string;
};

export function MemoryFactsPanel() {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [message, setMessage] = useState("正在读取长期记忆…");

  const load = () => {
    fetch("/api/ai/memories", { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setMessage(data.message || "读取失败");
          return;
        }
        setItems(data.items || []);
        setMessage(data.items?.length ? "" : "还没有长期记忆。后续在导入或笔记页里可自动提取。");
      });
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="glass-panel animate-rise space-y-4 rounded-[28px] p-5">
      <div>
        <h2 className="text-base font-medium text-[#111]">长期记忆</h2>
        <p className="mt-2 text-sm leading-6 text-[#666]">这里放的是稳定信息，不是普通笔记。后续问我时可以优先利用这些记忆。</p>
      </div>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-[#444]">
              <div className="flex items-center justify-between gap-3 text-xs text-[#888]">
                <span>{item.type}</span>
                <span>置信度 {Math.round(item.confidence * 100)}%</span>
              </div>
              <div className="mt-2">{item.content}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-[#666]">{message}</div>
      )}
    </section>
  );
}
