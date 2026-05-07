import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/base/Button";
import { getSessionUserId } from "@/lib/session";
import { requireOwnedExpense, toExpenseDTO } from "@/lib/expense";
import { formatMoney } from "@/lib/format-money";
import { formatRelativeTime } from "@/lib/date";

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const { id } = await params;
  const expense = await requireOwnedExpense(id, userId);
  if (!expense) notFound();

  const dto = toExpenseDTO(expense);

  return (
    <PageContainer width="form">
      <PageHeader title="这笔记录" />
      <div className="rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-5">
        <p className="text-sm text-[var(--text-muted)]">{dto.category?.emoji ?? "💰"} {dto.category?.name ?? "未分类"}</p>
        <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] [font-variant-numeric:tabular-nums]">
          {formatMoney(dto.amount, dto.currency)}
        </p>
        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{dto.note || "没有备注，也没关系。"}</p>
        <p className="mt-6 text-xs text-[var(--text-muted)]">记于 {formatRelativeTime(dto.occurredAt)}</p>
      </div>
      <div className="mt-6 flex justify-end">
        <Link href="/ledger"><Button variant="secondary">回到记账</Button></Link>
      </div>
    </PageContainer>
  );
}
