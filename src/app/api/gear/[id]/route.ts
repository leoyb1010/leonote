import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { guardUserWriteRequest } from "@/lib/request-guard";
import { GEAR_CATEGORY_OPTIONS, GEAR_STATUS_OPTIONS, requireOwnedGearItem, toGearDTO } from "@/lib/gear";

const gearPatchSchema = z.object({
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
});

function toDate(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function cleanSpecs(value: Record<string, unknown> | undefined) {
  if (value === undefined) return undefined;
  const entries = Object.entries(value)
    .filter(([, item]) => ["string", "number", "boolean"].includes(typeof item))
    .slice(0, 24);
  return JSON.stringify(Object.fromEntries(entries));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { id } = await params;
  const item = await requireOwnedGearItem(id, userId);
  if (!item) return NextResponse.json({ ok: false, message: "这个装备不在这里" }, { status: 404 });

  return NextResponse.json({ ok: true, item: toGearDTO(item) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "gear", { limit: 80 });
  if (guarded) return guarded;

  const { id } = await params;
  const item = await requireOwnedGearItem(id, userId);
  if (!item) return NextResponse.json({ ok: false, message: "这个装备不在这里" }, { status: 404 });

  const body = await request.json();
  const parsed = gearPatchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, message: "设备信息还没写完整" }, { status: 400 });
  const { specs, purchaseDate, warrantyUntil, currency, ...rest } = parsed.data;

  const updated = await prisma.gearItem.update({
    where: { id },
    data: {
      ...rest,
      currency: currency?.toUpperCase(),
      purchaseDate: toDate(purchaseDate),
      warrantyUntil: toDate(warrantyUntil),
      specsJson: cleanSpecs(specs),
    },
    include: { linkedExpense: { include: { category: true } } },
  });

  return NextResponse.json({ ok: true, item: toGearDTO(updated) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "gear", { limit: 80 });
  if (guarded) return guarded;

  const { id } = await params;
  const item = await requireOwnedGearItem(id, userId);
  if (!item) return NextResponse.json({ ok: false, message: "这个装备不在这里" }, { status: 404 });

  await prisma.gearItem.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
