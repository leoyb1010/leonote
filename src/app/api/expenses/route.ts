import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { listExpenses, requireOwnedCategory, toExpenseDTO } from "@/lib/expense";
import { guardUserWriteRequest } from "@/lib/request-guard";

// amount 单位为"分"（整数），前端需将元转分后传入。最大值 999999.00 元。
const expenseCreateSchema = z.object({
  amount: z.number().int().positive().max(99999900),
  categoryId: z.string().nullable().optional(),
  note: z.string().max(200).default(""),
  occurredAt: z.string().datetime().optional(),
  currency: z.string().length(3).default("CNY"),
});

function parseDateParam(value: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId");
  const from = parseDateParam(searchParams.get("from"));
  const to = parseDateParam(searchParams.get("to"));
  const limit = Number(searchParams.get("limit") ?? 50);

  const expenses = await listExpenses(userId, {
    categoryId: categoryId || undefined,
    from,
    to,
    take: Number.isFinite(limit) ? limit : 50,
  });

  return NextResponse.json({ ok: true, expenses: expenses.map(toExpenseDTO) });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "expenses");
  if (guarded) return guarded;

  const body = await request.json();
  const parsed = expenseCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "这笔花费还没写完整" }, { status: 400 });

  if (parsed.data.categoryId) {
    const category = await requireOwnedCategory(parsed.data.categoryId, userId);
    if (!category || category.isArchived) {
      return NextResponse.json({ ok: false, message: "这个类型暂时不能使用" }, { status: 400 });
    }
  }

  const expense = await prisma.expense.create({
    data: {
      userId,
      amount: parsed.data.amount,
      categoryId: parsed.data.categoryId ?? null,
      note: parsed.data.note.trim(),
      occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : new Date(),
      currency: parsed.data.currency.toUpperCase(),
    },
    include: { category: true },
  });

  return NextResponse.json({ ok: true, expense: toExpenseDTO(expense) });
}
