import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { guardUserWriteRequest } from "@/lib/request-guard";
import { GEAR_CATEGORY_OPTIONS, GEAR_STATUS_OPTIONS, listGearItems, parseGearCapture, toGearDTO, type GearStatus, type GearCategory } from "@/lib/gear";
import { requireOwnedCategory } from "@/lib/expense";

export const dynamic = "force-dynamic";

const gearCreateSchema = z.object({
  rawText: z.string().trim().max(300).optional(),
  name: z.string().trim().min(1).max(80).optional(),
  brand: z.string().trim().max(60).optional(),
  model: z.string().trim().max(80).optional(),
  category: z.enum(GEAR_CATEGORY_OPTIONS).optional(),
  status: z.enum(GEAR_STATUS_OPTIONS).optional(),
  location: z.string().trim().max(80).optional(),
  serialNumber: z.string().trim().max(120).optional(),
  purchaseDate: z.string().datetime().nullable().optional(),
  purchasePrice: z.number().int().positive().max(999999900).nullable().optional(),
  currency: z.string().length(3).optional(),
  purchaseChannel: z.string().trim().max(80).optional(),
  warrantyUntil: z.string().datetime().nullable().optional(),
  specs: z.record(z.unknown()).optional(),
  notes: z.string().trim().max(1000).optional(),
  createExpense: z.boolean().default(false),
  expenseCategoryId: z.string().nullable().optional(),
});

function toDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function cleanSpecs(value: Record<string, unknown> | undefined) {
  if (!value) return "{}";
  const entries = Object.entries(value)
    .filter(([, item]) => ["string", "number", "boolean"].includes(typeof item))
    .slice(0, 24);
  return JSON.stringify(Object.fromEntries(entries));
}

function mergeDraft(rawText: string | undefined, data: z.infer<typeof gearCreateSchema>) {
  const draft = rawText ? parseGearCapture(rawText) : parseGearCapture(data.name ?? "");
  return {
    name: data.name ?? draft.name,
    brand: data.brand ?? draft.brand,
    model: data.model ?? draft.model,
    category: data.category ?? draft.category,
    status: data.status ?? draft.status,
    location: data.location ?? draft.location,
    serialNumber: data.serialNumber ?? draft.serialNumber,
    purchaseDate: data.purchaseDate === undefined ? draft.purchaseDate : toDate(data.purchaseDate),
    purchasePrice: data.purchasePrice === undefined ? draft.purchasePrice : data.purchasePrice,
    currency: (data.currency ?? draft.currency).toUpperCase(),
    purchaseChannel: data.purchaseChannel ?? draft.purchaseChannel,
    warrantyUntil: data.warrantyUntil === undefined ? draft.warrantyUntil : toDate(data.warrantyUntil),
    specsJson: cleanSpecs(data.specs) || draft.specsJson,
    notes: data.notes ?? draft.notes,
  };
}

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all";
  const category = searchParams.get("category") || "all";
  const query = searchParams.get("q") || undefined;
  const items = await listGearItems(userId, {
    status: (GEAR_STATUS_OPTIONS as readonly string[]).includes(status) ? (status as GearStatus) : "all",
    category: (GEAR_CATEGORY_OPTIONS as readonly string[]).includes(category) ? (category as GearCategory) : "all",
    query,
  });

  return NextResponse.json({ ok: true, items: items.map(toGearDTO) });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "gear", { limit: 80 });
  if (guarded) return guarded;

  const body = await request.json();
  const parsed = gearCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "设备信息还没写完整" }, { status: 400 });

  if (!parsed.data.rawText && !parsed.data.name) {
    return NextResponse.json({ ok: false, message: "写上设备或物品型号就可以入库" }, { status: 400 });
  }

  const draft = mergeDraft(parsed.data.rawText, parsed.data);
  if (!draft.name.trim()) {
    return NextResponse.json({ ok: false, message: "写上设备或物品型号就可以入库" }, { status: 400 });
  }

  let expenseCategoryId = parsed.data.expenseCategoryId ?? null;
  if (expenseCategoryId) {
    const category = await requireOwnedCategory(expenseCategoryId, userId);
    if (!category || category.isArchived) expenseCategoryId = null;
  }

  const item = await prisma.$transaction(async (tx) => {
    let linkedExpenseId: string | null = null;
    if (parsed.data.createExpense && draft.purchasePrice) {
      const expense = await tx.expense.create({
        data: {
          userId,
          amount: draft.purchasePrice,
          currency: draft.currency,
          categoryId: expenseCategoryId,
          note: `${draft.name} 购入`,
          occurredAt: draft.purchaseDate ?? new Date(),
        },
      });
      linkedExpenseId = expense.id;
    }

    return tx.gearItem.create({
      data: {
        userId,
        ...draft,
        linkedExpenseId,
      },
      include: { linkedExpense: { include: { category: true } } },
    });
  });

  return NextResponse.json({ ok: true, item: toGearDTO(item) });
}
