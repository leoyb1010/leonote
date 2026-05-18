import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const GEAR_CATEGORY_OPTIONS = [
  "computer",
  "phone",
  "camera",
  "audio",
  "wearable",
  "home",
  "outdoor",
  "tool",
  "other",
] as const;

export const GEAR_STATUS_OPTIONS = [
  "active",
  "wishlist",
  "repair",
  "sold",
  "retired",
] as const;

export type GearCategory = (typeof GEAR_CATEGORY_OPTIONS)[number];
export type GearStatus = (typeof GEAR_STATUS_OPTIONS)[number];

type GearWithLinkedExpense = Prisma.GearItemGetPayload<{
  include: { linkedExpense: { include: { category: true } } };
}>;

const categoryKeywords: Array<{ category: GearCategory; patterns: RegExp[] }> = [
  { category: "computer", patterns: [/macbook|thinkpad|surface|电脑|笔记本|主机|显示器|键盘|鼠标|nas|硬盘|ssd/i] },
  { category: "phone", patterns: [/iphone|pixel|galaxy|小米|华为|手机|平板|ipad/i] },
  { category: "camera", patterns: [/sony\s?a\d|canon|nikon|fujifilm|富士|佳能|尼康|相机|镜头|gopro/i] },
  { category: "audio", patterns: [/airpods|bose|sony\s?wh|shure|耳机|音箱|麦克风|声卡/i] },
  { category: "wearable", patterns: [/watch|手表|手环|戒指|眼镜/i] },
  { category: "home", patterns: [/电视|冰箱|洗衣机|扫地|咖啡机|家电|路由器|灯/i] },
  { category: "outdoor", patterns: [/帐篷|背包|露营|自行车|滑雪|冲锋衣|户外/i] },
  { category: "tool", patterns: [/工具|电钻|螺丝刀|万用表|打印机|切割|焊/i] },
];

const brandAliases: Array<{ brand: string; patterns: RegExp[] }> = [
  { brand: "Apple", patterns: [/apple|苹果|macbook|iphone|ipad|airpods|watch/i] },
  { brand: "Sony", patterns: [/sony|索尼/i] },
  { brand: "Canon", patterns: [/canon|佳能/i] },
  { brand: "Nikon", patterns: [/nikon|尼康/i] },
  { brand: "Fujifilm", patterns: [/fujifilm|富士/i] },
  { brand: "DJI", patterns: [/dji|大疆/i] },
  { brand: "Bose", patterns: [/bose/i] },
  { brand: "Shure", patterns: [/shure|舒尔/i] },
  { brand: "Logitech", patterns: [/logitech|罗技/i] },
  { brand: "Keychron", patterns: [/keychron/i] },
  { brand: "Anker", patterns: [/anker|安克/i] },
  { brand: "Samsung", patterns: [/samsung|三星/i] },
  { brand: "Dell", patterns: [/dell|戴尔/i] },
  { brand: "Lenovo", patterns: [/lenovo|联想|thinkpad/i] },
  { brand: "ASUS", patterns: [/asus|华硕/i] },
  { brand: "Xiaomi", patterns: [/xiaomi|小米/i] },
  { brand: "Huawei", patterns: [/huawei|华为/i] },
  { brand: "Nintendo", patterns: [/nintendo|switch|任天堂/i] },
  { brand: "Valve", patterns: [/steam deck|valve/i] },
];

const purchaseChannels = [
  "Apple Store",
  "京东",
  "淘宝",
  "天猫",
  "闲鱼",
  "拼多多",
  "官网",
  "Amazon",
  "Best Buy",
  "B&H",
  "苏宁",
];

function parseJsonObject(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function toIso(date: Date | null | undefined) {
  return date ? date.toISOString() : null;
}

function clampOption<T extends readonly string[]>(value: unknown, options: T, fallback: T[number]) {
  return typeof value === "string" && (options as readonly string[]).includes(value) ? value as T[number] : fallback;
}

export function gearCategoryLabel(category: string) {
  const labels: Record<GearCategory, string> = {
    computer: "电脑与外设",
    phone: "手机和平板",
    camera: "影像设备",
    audio: "音频设备",
    wearable: "穿戴设备",
    home: "家用设备",
    outdoor: "户外装备",
    tool: "工具",
    other: "其他",
  };
  return labels[clampOption(category, GEAR_CATEGORY_OPTIONS, "other")];
}

export function gearStatusLabel(status: string) {
  const labels: Record<GearStatus, string> = {
    active: "在用",
    wishlist: "想买",
    repair: "维修中",
    sold: "已出掉",
    retired: "退役",
  };
  return labels[clampOption(status, GEAR_STATUS_OPTIONS, "active")];
}

export function toGearDTO(item: GearWithLinkedExpense) {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    model: item.model,
    category: item.category,
    categoryLabel: gearCategoryLabel(item.category),
    status: item.status,
    statusLabel: gearStatusLabel(item.status),
    location: item.location,
    serialNumber: item.serialNumber,
    purchaseDate: toIso(item.purchaseDate),
    purchasePrice: item.purchasePrice,
    currency: item.currency,
    purchaseChannel: item.purchaseChannel,
    warrantyUntil: toIso(item.warrantyUntil),
    specs: parseJsonObject(item.specsJson),
    notes: item.notes,
    linkedExpenseId: item.linkedExpenseId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    linkedExpense: item.linkedExpense
      ? {
          id: item.linkedExpense.id,
          amount: item.linkedExpense.amount,
          currency: item.linkedExpense.currency,
          note: item.linkedExpense.note,
          occurredAt: item.linkedExpense.occurredAt.toISOString(),
          category: item.linkedExpense.category
            ? {
                id: item.linkedExpense.category.id,
                name: item.linkedExpense.category.name,
                emoji: item.linkedExpense.category.emoji,
                color: item.linkedExpense.category.color,
              }
            : null,
        }
      : null,
  };
}

export async function requireOwnedGearItem(id: string, userId: string) {
  return prisma.gearItem.findFirst({
    where: { id, userId, deletedAt: null },
    include: { linkedExpense: { include: { category: true } } },
  });
}

export async function listGearItems(
  userId: string,
  options?: {
    status?: GearStatus | "all";
    category?: GearCategory | "all";
    query?: string;
    take?: number;
  },
) {
  const query = options?.query?.trim();
  return prisma.gearItem.findMany({
    where: {
      userId,
      deletedAt: null,
      status: options?.status && options.status !== "all" ? options.status : undefined,
      category: options?.category && options.category !== "all" ? options.category : undefined,
      OR: query
        ? [
            { name: { contains: query } },
            { brand: { contains: query } },
            { model: { contains: query } },
            { notes: { contains: query } },
            { serialNumber: { contains: query } },
          ]
        : undefined,
    },
    include: { linkedExpense: { include: { category: true } } },
    orderBy: [{ updatedAt: "desc" }],
    take: Math.min(Math.max(options?.take ?? 80, 1), 200),
  });
}

export async function getGearSummary(userId: string, now = new Date()) {
  const warrantyEnd = new Date(now);
  warrantyEnd.setDate(warrantyEnd.getDate() + 90);

  const [items, byCategory, totalValue, warrantyExpiring] = await Promise.all([
    prisma.gearItem.findMany({
      where: { userId, deletedAt: null },
      include: { linkedExpense: { include: { category: true } } },
      orderBy: [{ updatedAt: "desc" }],
      take: 8,
    }),
    prisma.gearItem.groupBy({
      by: ["category"],
      where: { userId, deletedAt: null },
      _count: { id: true },
      _sum: { purchasePrice: true },
    }),
    prisma.gearItem.aggregate({
      where: { userId, deletedAt: null, status: { in: ["active", "repair"] }, purchasePrice: { not: null } },
      _sum: { purchasePrice: true },
    }),
    prisma.gearItem.findMany({
      where: {
        userId,
        deletedAt: null,
        status: "active",
        warrantyUntil: { gte: now, lte: warrantyEnd },
      },
      include: { linkedExpense: { include: { category: true } } },
      orderBy: [{ warrantyUntil: "asc" }],
      take: 5,
    }),
  ]);

  const statusCounts = await prisma.gearItem.groupBy({
    by: ["status"],
    where: { userId, deletedAt: null },
    _count: { id: true },
  });
  const total = statusCounts.reduce((sum, item) => sum + item._count.id, 0);

  return {
    total,
    active: statusCounts.find((item) => item.status === "active")?._count.id ?? 0,
    wishlist: statusCounts.find((item) => item.status === "wishlist")?._count.id ?? 0,
    totalValue: totalValue._sum.purchasePrice ?? 0,
    byCategory: byCategory
      .map((item) => ({
        category: item.category,
        label: gearCategoryLabel(item.category),
        count: item._count.id,
        value: item._sum.purchasePrice ?? 0,
      }))
      .sort((a, b) => b.count - a.count || b.value - a.value),
    warrantyExpiring: warrantyExpiring.map(toGearDTO),
    recent: items.map(toGearDTO),
  };
}

function extractPrice(input: string) {
  const normalized = input.replace(/,/g, "");
  const explicit = normalized.match(/(?:¥|￥)\s*(\d+(?:\.\d{1,2})?)/) ??
    normalized.match(/(\d+(?:\.\d{1,2})?)\s*(?:元|人民币|rmb|cny)/i);
  const channelPattern = purchaseChannels.map((channel) => channel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const nearChannel = normalized.match(new RegExp(`(?:^|\\s)(\\d{3,7}(?:\\.\\d{1,2})?)\\s*(?=${channelPattern})(?:\\s|$)`, "i"));
  const trailing = normalized.match(/(?:^|\s)(\d{3,7}(?:\.\d{1,2})?)\s*$/);
  const looseCandidates = [...normalized.matchAll(/(?:^|\s)(\d{4,7}(?:\.\d{1,2})?)(?=\s|$)/g)]
    .filter((candidate) => {
      const value = Number(candidate[1]);
      return Number.isFinite(value) && value >= 1000;
    });
  const loose = looseCandidates.at(-1) ?? null;
  const match = explicit ?? nearChannel ?? trailing ?? loose;
  if (!match) return { cents: null as number | null, text: input };

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return { cents: null as number | null, text: input };
  return {
    cents: Math.round(amount * 100),
    text: `${input.slice(0, match.index)} ${input.slice((match.index ?? 0) + match[0].length)}`.replace(/\s+/g, " ").trim(),
  };
}

function dateFromMatch(match: RegExpMatchArray | null) {
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3] ?? 1);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  const date = new Date(year, month - 1, day);
  return Number.isFinite(date.getTime()) ? date : null;
}

function extractDate(text: string, prefix: RegExp) {
  const pattern = new RegExp(`${prefix.source}[^0-9]*(\\d{4})[-/.年](\\d{1,2})(?:[-/.月](\\d{1,2})日?)?`, "i");
  const match = text.match(pattern);
  return { date: dateFromMatch(match), raw: match?.[0] ?? "" };
}

function inferBrand(text: string) {
  return brandAliases.find((item) => item.patterns.some((pattern) => pattern.test(text)))?.brand ?? "";
}

function inferCategory(text: string): GearCategory {
  return categoryKeywords.find((item) => item.patterns.some((pattern) => pattern.test(text)))?.category ?? "other";
}

function inferStatus(text: string): GearStatus {
  if (/想买|wishlist|候选|清单|预购/i.test(text)) return "wishlist";
  if (/维修|返修|repair/i.test(text)) return "repair";
  if (/已出|卖了|转卖|sold/i.test(text)) return "sold";
  if (/闲置|退役|retired/i.test(text)) return "retired";
  return "active";
}

function inferChannel(text: string) {
  return purchaseChannels.find((channel) => text.toLowerCase().includes(channel.toLowerCase())) ?? "";
}

function cleanName(text: string) {
  return text
    .replace(/(?:SN|S\/N|序列号|串号)\s*[:：]?\s*[A-Za-z0-9-_.]+/gi, "")
    .replace(/(?:保修到|质保到|保修至|质保至|warranty(?: until)?)\s*[:：]?\s*\d{4}[-/.年]\d{1,2}(?:[-/.月]\d{1,2}日?)?/gi, "")
    .replace(/(?:购入|购买|买于|入手|purchase)\s*[:：]?\s*\d{4}[-/.年]\d{1,2}(?:[-/.月]\d{1,2}日?)?/gi, "")
    .replace(/想买|wishlist|候选|清单|维修|返修|已出|卖了|转卖|闲置|退役/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseGearCapture(rawText: string) {
  const source = rawText.trim();
  let working = source;

  const warranty = extractDate(working, /(?:保修到|质保到|保修至|质保至|warranty(?: until)?)/);
  if (warranty.raw) working = working.replace(warranty.raw, " ");

  const purchase = extractDate(working, /(?:购入|购买|买于|入手|purchase)/);
  if (purchase.raw) working = working.replace(purchase.raw, " ");

  const price = extractPrice(working);
  working = price.text;

  const serial = working.match(/(?:SN|S\/N|序列号|串号)\s*[:：]?\s*([A-Za-z0-9-_.]+)/i)?.[1] ?? "";
  const brand = inferBrand(source);
  const category = inferCategory(source);
  const status = inferStatus(source);
  const purchaseChannel = inferChannel(source);
  if (purchaseChannel) working = working.replace(purchaseChannel, " ");
  const name = cleanName(working) || source;

  return {
    name: name.slice(0, 80),
    brand,
    model: name.slice(0, 80),
    category,
    status,
    location: "",
    serialNumber: serial,
    purchaseDate: purchase.date,
    purchasePrice: price.cents,
    currency: "CNY",
    purchaseChannel,
    warrantyUntil: warranty.date,
    specsJson: "{}",
    notes: source === name ? "" : source,
  };
}
