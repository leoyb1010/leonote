"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/base/Button";
import { formatMoney, parseAmountToCents } from "@/lib/format-money";
import { formatRelativeTime } from "@/lib/date";
import { CategoryPills } from "@/components/ledger/CategoryPills";
import type { ExpenseCategoryDTO, ExpenseDTO } from "@/components/ledger/types";

type Props = {
  expense: ExpenseDTO;
  categories: ExpenseCategoryDTO[];
};

function centsToInput(amount: number) {
  const value = amount / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function ExpenseDetail({ expense: initialExpense, categories }: Props) {
  const router = useRouter();
  const [expense, setExpense] = useState(initialExpense);
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(centsToInput(initialExpense.amount));
  const [categoryId, setCategoryId] = useState<string | null>(initialExpense.categoryId);
  const [occurredAt, setOccurredAt] = useState(toDateTimeLocal(initialExpense.occurredAt));
  const [note, setNote] = useState(initialExpense.note);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [toast, setToast] = useState("");

  const title = useMemo(() => expense.note || expense.category?.name || "一笔花费", [expense]);

  function resetForm() {
    setAmount(centsToInput(expense.amount));
    setCategoryId(expense.categoryId);
    setOccurredAt(toDateTimeLocal(expense.occurredAt));
    setNote(expense.note);
  }

  async function save() {
    const nextAmount = parseAmountToCents(amount);
    if (!nextAmount) {
      setToast("金额至少要有 1 分。");
      return;
    }

    setSaving(true);
    setToast("");

    const res = await fetch(`/api/expenses/${expense.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: nextAmount,
        categoryId,
        occurredAt: occurredAt ? new Date(occurredAt).toISOString() : undefined,
        note: note.trim(),
        currency: expense.currency,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok || !data.ok) {
      setToast(data.message ?? "这笔先没记上，再试一次");
      return;
    }

    setExpense(data.expense);
    setEditing(false);
    setToast("已安静更新。");
    window.setTimeout(() => setToast(""), 2200);
  }

  async function deleteExpense() {
    setDeleting(true);
    setToast("");

    const res = await fetch(`/api/expenses/${expense.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setDeleting(false);

    if (!res.ok || !data.ok) {
      setToast(data.message ?? "这笔先没删掉，再试一次");
      return;
    }

    router.replace("/ledger");
    router.refresh();
  }

  return (
    <>
      <div className="card-premium p-5">
        {editing ? (
          <div className="space-y-5">
            <div>
              <label className="text-xs text-[var(--text-muted)]" htmlFor="expense-amount">
                金额
              </label>
              <input
                id="expense-amount"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                className="mt-2 h-12 w-full rounded-2xl border border-[var(--hairline)] bg-[var(--material-inset)] px-4 text-2xl font-semibold text-[var(--text-primary)] numeric-display"
              />
            </div>

            <div>
              <p className="mb-2 text-xs text-[var(--text-muted)]">类型</p>
              <CategoryPills
                categories={categories}
                selectedId={categoryId}
                onSelect={setCategoryId}
                showCreateLink={false}
              />
            </div>

            <div>
              <label className="text-xs text-[var(--text-muted)]" htmlFor="expense-time">
                时间
              </label>
              <input
                id="expense-time"
                type="datetime-local"
                value={occurredAt}
                onChange={(event) => setOccurredAt(event.target.value)}
                className="mt-2 h-11 w-full rounded-2xl border border-[var(--hairline)] bg-[var(--material-inset)] px-4 text-sm text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="text-xs text-[var(--text-muted)]" htmlFor="expense-note">
                备注
              </label>
              <textarea
                id="expense-note"
                value={note}
                maxLength={200}
                onChange={(event) => setNote(event.target.value)}
                className="mt-2 min-h-[112px] w-full resize-none rounded-2xl border border-[var(--hairline)] bg-[var(--material-inset)] px-4 py-3 text-sm leading-6 text-[var(--text-primary)]"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  resetForm();
                  setEditing(false);
                }}
              >
                取消
              </Button>
              <Button onClick={save} loading={saving}>
                保存
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--text-muted)]">
              {expense.category?.emoji ?? "💰"} {expense.category?.name ?? "未分类"}
            </p>
            <p className="mt-3 text-3xl font-semibold text-[var(--text-primary)] numeric-display">
              {formatMoney(expense.amount, expense.currency)}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              {expense.note || "没有备注，也没关系。"}
            </p>
            <p className="mt-6 text-xs text-[var(--text-muted)]">记于 {formatRelativeTime(expense.occurredAt)}</p>
          </>
        )}
      </div>

      {toast ? <p className="mt-4 text-center text-xs text-[var(--text-muted)]">{toast}</p> : null}

      <div className="mt-6 flex flex-wrap justify-between gap-2">
        <Button
          variant="danger"
          icon={<Trash2 size={15} />}
          onClick={() => setConfirmingDelete(true)}
        >
          删除
        </Button>
        <div className="flex gap-2">
          <Link href="/ledger"><Button variant="secondary">回到记账</Button></Link>
          {!editing ? (
            <Button icon={<Pencil size={15} />} onClick={() => setEditing(true)}>
              编辑
            </Button>
          ) : null}
        </div>
      </div>

      {confirmingDelete ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[var(--overlay-scrim)] px-4 py-6 sm:items-center">
          <div className="w-full max-w-sm rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-5 shadow-[var(--shadow-md)]">
            <h2 className="text-base font-medium text-[var(--text-primary)]">删掉这一笔？</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              「{title}」会进入回收区，之后可以统一清理。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
                再想想
              </Button>
              <Button variant="danger" loading={deleting} onClick={deleteExpense}>
                删除
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
