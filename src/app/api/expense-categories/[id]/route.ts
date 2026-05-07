import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EXPENSE_COLOR_OPTIONS, requireOwnedCategory, toExpenseCategoryDTO } from "@/lib/expense";

const categoryPatchSchema = z.object({
  name: z.string().trim().min(1).max(20).optional(),
  emoji: z.string().min(1).max(4).optional(),
  color: z.enum(EXPENSE_COLOR_OPTIONS).optional(),
  isArchived: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { id } = await params;
  const category = await requireOwnedCategory(id, userId);
  if (!category) return NextResponse.json({ ok: false, message: "这个类型不在这里" }, { status: 404 });

  const body = await request.json();
  const parsed = categoryPatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "参数不合法" }, { status: 400 });

  try {
    const updated = await prisma.expenseCategory.update({
      where: { id },
      data: parsed.data,
      include: { _count: { select: { expenses: true } } },
    });

    return NextResponse.json({ ok: true, category: toExpenseCategoryDTO(updated) });
  } catch {
    return NextResponse.json({ ok: false, message: "这个名字已经用过了" }, { status: 409 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { id } = await params;
  const category = await requireOwnedCategory(id, userId);
  if (!category) return NextResponse.json({ ok: false, message: "这个类型不在这里" }, { status: 404 });

  await prisma.expenseCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
