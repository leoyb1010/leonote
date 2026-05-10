"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/base/Button";
import { parseAmountToCents, stripAmountFromText } from "@/lib/format-money";
import { CategoryPills } from "./CategoryPills";
import type { ExpenseCategoryDTO, ExpenseDTO } from "./types";

const saveMessages = [
  "已记下。",
  "这笔花费已经安放好。",
  "已留下，月底再慢慢看。",
];

type Props = {
  categories: ExpenseCategoryDTO[];
  onCreated?: (expense: ExpenseDTO) => void;
};

export function ExpenseQuickCapture({ categories, onCreated }: Props) {
  const [value, setValue] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(categories[0]?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const detectedAmount = useMemo(() => parseAmountToCents(value), [value]);

  async function submit() {
    const text = value.trim();
    const amount = parseAmountToCents(text);

    if (!text || saving) return;
    if (!amount) {
      setError("写上金额就可以记下，比如 拿铁 35");
      return;
    }

    setSaving(true);
    setError("");

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        categoryId,
        note: stripAmountFromText(text),
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok || !data.ok) {
      setError(data.message ?? "这笔先没记上，再试一次");
      return;
    }

    setValue("");
    const message = saveMessages[Math.floor(Math.random() * saveMessages.length)];
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
    onCreated?.(data.expense);
  }

  return (
    <div className="relative space-y-3">
      <div className="rounded-[28px] border border-[var(--hairline)] bg-[var(--material-elevated)] p-2 shadow-[var(--shadow-sm)]">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder="花了什么？比如 拿铁 35"
          className="min-h-[56px] w-full resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-[var(--text-placeholder)]"
          rows={1}
        />
        <div className="flex items-center justify-between gap-3 px-2 pb-1">
          <span className="text-xs text-[var(--text-muted)]">
            {detectedAmount ? "金额已识别 · Enter 记下" : "写一句话，末尾带上金额"}
          </span>
          <Button size="md" onClick={submit} loading={saving} variant="primary">
            记下
          </Button>
        </div>
      </div>

      <CategoryPills categories={categories} selectedId={categoryId} onSelect={setCategoryId} />

      {error ? <p className="text-center text-xs text-[var(--danger)]">{error}</p> : null}
      {toast ? <p className="text-center text-xs text-[var(--text-muted)]">{toast}</p> : null}
    </div>
  );
}
