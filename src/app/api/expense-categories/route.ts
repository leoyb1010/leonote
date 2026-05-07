import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EXPENSE_COLOR_OPTIONS, listExpenseCategories, toExpenseCategoryDTO } from "@/lib/expense";
import { guardUserWriteRequest } from "@/lib/request-guard";

const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(20),
  emoji: z.string().min(1).max(4).default("💰"),
  color: z.enum(EXPENSE_COLOR_OPTIONS).default("slate"),
});

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived") === "1";

  const categories = await listExpenseCategories(userId, { includeArchived });
  return NextResponse.json({ ok: true, categories: categories.map(toExpenseCategoryDTO) });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "expense-categories");
  if (guarded) return guarded;

  const body = await request.json();
  const parsed = categoryCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "给这个类型起个短一点的名字" }, { status: 400 });

  const maxSort = await prisma.expenseCategory.aggregate({
    where: { userId },
    _max: { sortOrder: true },
  });

  try {
    const category = await prisma.expenseCategory.create({
      data: {
        userId,
        name: parsed.data.name,
        emoji: parsed.data.emoji,
        color: parsed.data.color,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
      include: { _count: { select: { expenses: true } } },
    });

    return NextResponse.json({ ok: true, category: toExpenseCategoryDTO(category) });
  } catch {
    return NextResponse.json({ ok: false, message: "这个类型已经在了" }, { status: 409 });
  }
}
