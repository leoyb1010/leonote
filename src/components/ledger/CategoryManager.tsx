"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/base/Button";
import type { ExpenseCategoryDTO } from "./types";

const quickTemplates = [
  { name: "AI 订阅", emoji: "🤖", color: "violet" },
  { name: "咖啡", emoji: "☕️", color: "amber" },
  { name: "书", emoji: "📚", color: "sky" },
  { name: "健身", emoji: "🏋️", color: "emerald" },
];

type Props = {
  initialCategories: ExpenseCategoryDTO[];
};

export function CategoryManager({ initialCategories }: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💰");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function createCategory(input?: { name: string; emoji: string; color?: string }) {
    const payload = input ?? { name, emoji, color: "slate" };
    if (!payload.name.trim() || saving) return;

    setSaving(true);
    setMessage("");

    const res = await fetch("/api/expense-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok || !data.ok) {
      setMessage(data.message ?? "这个类型先没放进去");
      return;
    }

    setCategories((prev) => [...prev, data.category]);
    setName("");
    setEmoji("💰");
    setMessage("已放好。");
  }

  async function removeCategory(id: string) {
    const res = await fetch(`/api/expense-categories/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setCategories((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-4">
        <h2 className="text-sm font-medium text-[var(--text-secondary)]">给花费起一个名字</h2>
        <div className="mt-4 flex gap-2">
          <input
            value={emoji}
            onChange={(event) => setEmoji(event.target.value.slice(0, 4))}
            className="h-11 w-14 rounded-xl border border-[var(--hairline)] bg-transparent px-3 text-center outline-none"
            aria-label="类型 emoji"
          />
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="比如 AI 订阅"
            className="h-11 min-w-0 flex-1 rounded-xl border border-[var(--hairline)] bg-transparent px-3 text-sm outline-none placeholder:text-[var(--text-placeholder)]"
          />
          <Button onClick={() => void createCategory()} loading={saving} icon={<Plus size={14} />}>
            记下
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {quickTemplates.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => void createCategory(item)}
              className="min-h-[36px] rounded-full border border-[var(--hairline)] px-3 text-xs text-[var(--text-secondary)] hover:bg-[var(--interactive-hover)]"
            >
              {item.emoji} {item.name}
            </button>
          ))}
        </div>

        {message ? <p className="mt-3 text-xs text-[var(--text-muted)]">{message}</p> : null}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">已有类型</h2>
        <div className="divide-y divide-[var(--hairline)] rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-1">
          {categories.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              还没有类型。第一条可以从 AI 订阅开始。
            </p>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-3.5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    <span className="mr-1.5" aria-hidden>{category.emoji}</span>
                    {category.name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {category.expenseCount ?? 0} 笔记录
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void removeCategory(category.id)}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                  aria-label={`拿掉 ${category.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
