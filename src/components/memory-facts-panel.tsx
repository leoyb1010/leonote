"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { AISpark } from "@/components/ui/AISpark";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { MemoryFactCard } from "@/components/ui/MemoryFactCard";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";

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
  const [activeType, setActiveType] = useState<string>("全部");

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

  const types = useMemo(() => ["全部", ...Array.from(new Set(items.map((item) => item.type)))], [items]);
  const filteredItems = useMemo(
    () => (activeType === "全部" ? items : items.filter((item) => item.type === activeType)),
    [activeType, items]
  );

  return (
    <GlassPanel blur="xl" glow="brand" className="relative overflow-hidden rounded-[var(--radius-xl)] p-5">
      <AISpark density={14} subdued className="opacity-60" />
      <div className="relative z-10 space-y-5">
        <div>
          <div className="text-[11px] font-semibold text-[var(--text-muted)]">Memory Facts</div>
          <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">长期记忆</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
            这里放的是稳定信息，不是普通笔记。切换类别时使用 stagger 淡出重排，帮助你快速理解记忆分布。
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {types.map((type) => {
            const active = activeType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={cn(
                  "rounded-[var(--radius-pill)] border px-3 py-2 text-xs transition",
                  active
                    ? "border-[var(--ai-soft)] bg-[var(--ai-soft)] text-[var(--ai-accent)]"
                    : "border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--text-primary)]"
                )}
              >
                {type}
              </button>
            );
          })}
        </div>

        {filteredItems.length ? (
          <motion.div
            layout
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="columns-1 gap-4 md:columns-2 xl:columns-3"
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div key={item.id} layout variants={staggerItem} initial="initial" animate="animate" exit="exit">
                  <MemoryFactCard
                    id={item.id}
                    type={item.type}
                    content={item.content}
                    confidence={item.confidence}
                    updatedAt={item.updatedAt}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-sm text-[var(--text-muted)]">
            {message}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
