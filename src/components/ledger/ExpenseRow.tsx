"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/date";
import { formatMoney } from "@/lib/format-money";
import type { ExpenseDTO } from "./types";

type Props = {
  expense: ExpenseDTO;
  href?: string;
  onDeleted?: (expense: ExpenseDTO) => void;
};

export function ExpenseRow({ expense, href, onDeleted }: Props) {
  const router = useRouter();
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");
  const category = expense.category;
  const title = expense.note || category?.name || "一笔花费";
  const targetHref = href ?? `/ledger/${expense.id}`;

  function openDetail() {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    router.push(targetHref);
  }

  function startLongPress() {
    longPressTriggered.current = false;
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      setSheetOpen(true);
    }, 500);
  }

  function clearLongPress() {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
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

    setConfirmingDelete(false);
    setSheetOpen(false);
    onDeleted?.(expense);
  }

  async function copyAmount() {
    await navigator.clipboard?.writeText(formatMoney(expense.amount, expense.currency));
    setToast("金额已复制。");
    window.setTimeout(() => setToast(""), 1800);
  }

  return (
    <>
      <div
        role="link"
        tabIndex={0}
        onClick={openDetail}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openDetail();
          }
        }}
        onPointerDown={(event) => {
          if (event.pointerType === "touch") startLongPress();
        }}
        onPointerUp={clearLongPress}
        onPointerCancel={clearLongPress}
        onPointerLeave={clearLongPress}
        className="group relative grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-[var(--radius-md)] border border-transparent px-3.5 py-4 transition-[background-color,border-color] duration-[var(--duration-quick)] hover:bg-[var(--interactive-hover)] md:grid-cols-[minmax(0,1fr)_auto_auto] md:py-3"
      >
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0" aria-hidden>{category?.emoji ?? "💰"}</span>
            <h3 className="truncate text-[15px] font-medium tracking-[-0.01em] text-[var(--text-primary)]">
              {title}
            </h3>
          </div>
          <div className="mt-2 flex min-w-0 items-center gap-2 text-xs text-[var(--text-faint)]">
            <span className="truncate rounded-full bg-[var(--interactive-hover)] px-2 py-0.5 text-[var(--text-secondary)]">
              {category?.name ?? "未分类"}
            </span>
            <time>{formatRelativeTime(expense.occurredAt)}</time>
          </div>
        </div>

        <div className="shrink-0 pt-0.5 text-right text-[15px] font-medium text-[var(--text-primary)] [font-variant-numeric:tabular-nums]">
          {formatMoney(expense.amount, expense.currency)}
        </div>

        <div className="hidden shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 md:flex">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              router.push(targetHref);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--interactive-hover)] hover:text-[var(--text-primary)]"
            aria-label={`编辑 ${title}`}
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setConfirmingDelete(true);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
            aria-label={`删除 ${title}`}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {toast ? <p className="px-3.5 pb-2 text-xs text-[var(--text-muted)]">{toast}</p> : null}

      {sheetOpen ? (
        <div className="fixed inset-0 z-[70] bg-[var(--overlay-scrim)] md:hidden" onClick={() => setSheetOpen(false)}>
          <div
            className="absolute inset-x-3 bottom-4 rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-2 shadow-[var(--shadow-md)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" onClick={() => router.push(targetHref)} className="flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-4 text-sm hover:bg-[var(--interactive-hover)]">
              <Pencil size={16} /> 编辑
            </button>
            <button type="button" onClick={() => setConfirmingDelete(true)} className="flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-4 text-sm text-[var(--danger)] hover:bg-[var(--danger-soft)]">
              <Trash2 size={16} /> 删除
            </button>
            <button type="button" onClick={() => void copyAmount()} className="flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-4 text-sm hover:bg-[var(--interactive-hover)]">
              <Copy size={16} /> 复制金额
            </button>
            <button type="button" onClick={() => router.push(targetHref)} className="flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-4 text-sm hover:bg-[var(--interactive-hover)]">
              <ExternalLink size={16} /> 跳详情
            </button>
          </div>
        </div>
      ) : null}

      {confirmingDelete ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[var(--overlay-scrim)] px-4 py-6 sm:items-center">
          <div className="w-full max-w-sm rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-5 shadow-[var(--shadow-md)]">
            <h2 className="text-base font-medium text-[var(--text-primary)]">删掉这一笔？</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              「{title}」会进入回收区，不会立刻从数据库里消失。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="h-10 rounded-xl border border-[var(--hairline)] px-4 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                再想想
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void deleteExpense()}
                className="h-10 rounded-xl px-4 text-sm text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-50"
              >
                {deleting ? "删除中" : "删除"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
