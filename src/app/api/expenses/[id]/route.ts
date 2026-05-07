import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { requireOwnedCategory, requireOwnedExpense, toExpenseDTO } from "@/lib/expense";

const expensePatchSchema = z.object({
  amount: z.number().int().positive().max(99999900).optional(),
  categoryId: z.string().nullable().optional(),
  note: z.string().max(200).optional(),
  occurredAt: z.string().datetime().optional(),
  currency: z.string().length(3).optional(),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { id } = await params;
  const expense = await requireOwnedExpense(id, userId);
  if (!expense) return NextResponse.json({ ok: false, message: "这笔记录不在这里" }, { status: 404 });

  return NextResponse.json({ ok: true, expense: toExpenseDTO(expense) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { id } = await params;
  const existing = await requireOwnedExpense(id, userId);
  if (!existing) return NextResponse.json({ ok: false, message: "这笔记录不在这里" }, { status: 404 });

  const body = await request.json();
  const parsed = expensePatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "参数不合法" }, { status: 400 });

  if (parsed.data.categoryId) {
    const category = await requireOwnedCategory(parsed.data.categoryId, userId);
    if (!category || category.isArchived) {
      return NextResponse.json({ ok: false, message: "这个类型暂时不能使用" }, { status: 400 });
    }
  }

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      ...parsed.data,
      note: parsed.data.note?.trim(),
      occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : undefined,
      currency: parsed.data.currency?.toUpperCase(),
    },
    include: { category: true },
  });

  return NextResponse.json({ ok: true, expense: toExpenseDTO(updated) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { id } = await params;
  const existing = await requireOwnedExpense(id, userId);
  if (!existing) return NextResponse.json({ ok: false, message: "这笔记录不在这里" }, { status: 404 });

  await prisma.expense.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
