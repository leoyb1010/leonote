"use client";

import { useState } from "react";
import { Archive, Plus, Trash2, Undo2 } from "lucide-react";
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
  const [pendingDelete, setPendingDelete] = useState<ExpenseCategoryDTO | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

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

  async function archiveCategory(category: ExpenseCategoryDTO, isArchived: boolean) {
    setBusyId(category.id);
    setMessage("");

    const res = await fetch(`/api/expense-categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);

    if (!res.ok || !data.ok) {
      setMessage(data.message ?? "这个类型先没处理好");
      return;
    }

    setCategories((prev) => prev.map((item) => (item.id === category.id ? data.category : item)));
    setPendingDelete(null);
    setMessage(isArchived ? "已归档，历史记录仍然保留。" : "已重新启用。");
  }

  async function removeCategory(category: ExpenseCategoryDTO) {
    setBusyId(category.id);
    setMessage("");

    const res = await fetch(`/api/expense-categories/${category.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);

    if (!res.ok || !data.ok) {
      setMessage(data.message ?? "这个类型先没拿掉");
      return;
    }

    setCategories((prev) => prev.filter((item) => item.id !== category.id));
    setPendingDelete(null);
    setMessage("已拿掉。");
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
                    {category.isArchived ? (
                      <span className="ml-2 rounded-full bg-[var(--interactive-hover)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                        已归档
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {category.expenseCount ?? 0} 笔记录
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={busyId === category.id}
                    onClick={() => void archiveCategory(category, !category.isArchived)}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--interactive-hover)] hover:text-[var(--text-primary)] disabled:opacity-50"
                    aria-label={category.isArchived ? `启用 ${category.name}` : `归档 ${category.name}`}
                  >
                    {category.isArchived ? <Undo2 size={15} /> : <Archive size={15} />}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === category.id}
                    onClick={() => setPendingDelete(category)}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] disabled:opacity-50"
                    aria-label={`拿掉 ${category.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {pendingDelete ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[var(--overlay-scrim)] px-4 py-6 sm:items-center">
          <div className="w-full max-w-sm rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-5 shadow-[var(--shadow-md)]">
            <h2 className="text-base font-medium text-[var(--text-primary)]">
              要拿掉「{pendingDelete.name}」吗？
            </h2>
            {(pendingDelete.expenseCount ?? 0) > 0 ? (
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                它还连着 {pendingDelete.expenseCount} 笔记录。为了不让历史记录变成未分类，建议先归档。
              </p>
            ) : (
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                这个类型没有关联记录，可以彻底拿掉。
              </p>
            )}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={() => setPendingDelete(null)}>
                再想想
              </Button>
              {(pendingDelete.expenseCount ?? 0) > 0 ? (
                <Button
                  variant="secondary"
                  loading={busyId === pendingDelete.id}
                  icon={<Archive size={15} />}
                  onClick={() => void archiveCategory(pendingDelete, true)}
                >
                  归档
                </Button>
              ) : (
                <Button
                  variant="danger"
                  loading={busyId === pendingDelete.id}
                  onClick={() => void removeCategory(pendingDelete)}
                >
                  删除
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
