import { lookup } from "node:dns/promises";
import net from "node:net";
import { GEAR_CATEGORY_OPTIONS, parseGearCapture, type GearCategory } from "@/lib/gear";

const MAX_HTML_BYTES = 768 * 1024;
const REQUEST_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;
const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal"]);
const ALLOWED_CONTENT_TYPES = ["text/html", "application/xhtml+xml", "text/plain"];

export type GearLinkPreview = {
  sourceUrl: string;
  sourceHost: string;
  title: string;
  description: string;
  imageUrl: string;
  rawText: string;
  draft: {
    name: string;
    brand: string;
    model: string;
    category: GearCategory;
    purchasePrice: number | null;
    currency: string;
    purchaseChannel: string;
    specs: Record<string, string | number | boolean>;
    notes: string;
  };
};

type ProductMetadata = {
  name?: string;
  brand?: string;
  model?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  sku?: string;
  mpn?: string;
  specs?: Record<string, string | number | boolean>;
};

function isBlockedIp(ip: string) {
  if (net.isIP(ip) === 4) {
    return (
      ip.startsWith("10.") ||
      ip.startsWith("127.") ||
      ip.startsWith("169.254.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
      ip.startsWith("192.168.")
    );
  }
  if (net.isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80");
  }
  return true;
}

async function assertSafeUrl(raw: string) {
  const target = new URL(raw);
  if (!["http:", "https:"].includes(target.protocol)) throw new Error("仅支持 http/https 商品链接");
  if (BLOCKED_HOSTS.has(target.hostname.toLowerCase())) throw new Error("不允许读取本地或保留地址");
  const resolved = await lookup(target.hostname, { all: true });
  if (!resolved.length || resolved.some((item) => isBlockedIp(item.address))) {
    throw new Error("不允许读取内网或保留地址");
  }
  return target;
}

function decodeHtml(input: string) {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(input: string) {
  return decodeHtml(input.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
}

function getTitle(html: string) {
  return decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
}

function getAttributes(tag: string) {
  const attrs: Record<string, string> = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g)) {
    const key = match[1].toLowerCase();
    const raw = match[2];
    attrs[key] = decodeHtml(raw.replace(/^['"]|['"]$/g, ""));
  }
  return attrs;
}

function extractMeta(html: string) {
  const meta = new Map<string, string>();
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = getAttributes(match[0]);
    const key = (attrs.property || attrs.name || attrs.itemprop || "").toLowerCase();
    const content = attrs.content;
    if (key && content && !meta.has(key)) meta.set(key, content);
  }
  return meta;
}

function asArray(value: unknown): unknown[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getNameLike(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: unknown }).name;
    return typeof name === "string" ? name.trim() : "";
  }
  return "";
}

function collectJsonLdNodes(value: unknown): unknown[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(collectJsonLdNodes);
  if (typeof value !== "object") return [];
  const object = value as Record<string, unknown>;
  const graph = object["@graph"];
  return [object, ...collectJsonLdNodes(graph)];
}

function isProductNode(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const rawType = (value as Record<string, unknown>)["@type"];
  const types = Array.isArray(rawType) ? rawType : [rawType];
  return types.some((item) => typeof item === "string" && item.toLowerCase() === "product");
}

function normalizeCurrency(raw: unknown, priceText = "") {
  const source = `${typeof raw === "string" ? raw : ""} ${priceText}`.trim();
  if (/cny|rmb|人民币|￥|¥/i.test(source)) return "CNY";
  if (/usd|us\$|\$/i.test(source)) return "USD";
  if (/eur|€/i.test(source)) return "EUR";
  if (/jpy|円/i.test(source)) return "JPY";
  const code = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  return /^[A-Z]{3}$/.test(code) ? code : "CNY";
}

function parsePrice(raw: unknown) {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw !== "string") return null;
  const normalized = decodeHtml(raw).replace(/,/g, "");
  const match = normalized.match(/(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function priceToCents(value: number | null) {
  return value ? Math.round(value * 100) : null;
}

function getOfferData(product: Record<string, unknown>) {
  const offer = asArray(product.offers)[0];
  if (!offer || typeof offer !== "object") return {};
  const data = offer as Record<string, unknown>;
  return {
    price: parsePrice(data.price ?? data.lowPrice ?? data.highPrice),
    currency: normalizeCurrency(data.priceCurrency, String(data.price ?? "")),
  };
}

function extractJsonLdProduct(html: string): ProductMetadata {
  for (const match of html.matchAll(/<script\b[^>]*type=["'][^"']*ld\+json[^"']*["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(decodeHtml(match[1]));
      const product = collectJsonLdNodes(parsed).find(isProductNode) as Record<string, unknown> | undefined;
      if (!product) continue;
      const offer = getOfferData(product);
      const image = asArray(product.image).map(getNameLike).find(Boolean);
      const specs: Record<string, string | number | boolean> = {};
      for (const item of asArray(product.additionalProperty).slice(0, 12)) {
        if (!item || typeof item !== "object") continue;
        const prop = item as Record<string, unknown>;
        const key = getNameLike(prop.name);
        const value = prop.value;
        if (key && ["string", "number", "boolean"].includes(typeof value)) specs[key] = value as string | number | boolean;
      }
      if (typeof product.sku === "string") specs.sku = product.sku;
      if (typeof product.mpn === "string") specs.mpn = product.mpn;
      return {
        name: getNameLike(product.name),
        brand: getNameLike(product.brand),
        model: getNameLike(product.model),
        description: getNameLike(product.description),
        imageUrl: image,
        price: offer.price ?? undefined,
        currency: offer.currency,
        sku: typeof product.sku === "string" ? product.sku : undefined,
        mpn: typeof product.mpn === "string" ? product.mpn : undefined,
        specs,
      };
    } catch {
      continue;
    }
  }
  return {};
}

function extractMetaProduct(html: string): ProductMetadata {
  const meta = extractMeta(html);
  const title = meta.get("og:title") || meta.get("twitter:title") || getTitle(html);
  const description = meta.get("og:description") || meta.get("description") || meta.get("twitter:description");
  const priceText = meta.get("product:price:amount") || meta.get("og:price:amount") || meta.get("twitter:data1") || meta.get("price");
  return {
    name: title,
    description,
    imageUrl: meta.get("og:image") || meta.get("twitter:image"),
    price: parsePrice(priceText) ?? undefined,
    currency: normalizeCurrency(meta.get("product:price:currency") || meta.get("og:price:currency"), priceText),
  };
}

function bestValue(...values: Array<string | undefined>) {
  return values.map((value) => value?.trim()).find((value): value is string => Boolean(value)) ?? "";
}

function cleanProductName(value: string) {
  return value
    .replace(/\s*[-_|]\s*(京东|淘宝|天猫|Amazon|Apple|Sony|B&H|Best Buy).*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function validCategory(value: string): GearCategory {
  return GEAR_CATEGORY_OPTIONS.includes(value as GearCategory) ? value as GearCategory : "other";
}

function mergeMetadata(jsonLd: ProductMetadata, meta: ProductMetadata): ProductMetadata {
  return {
    name: bestValue(jsonLd.name, meta.name),
    brand: bestValue(jsonLd.brand, meta.brand),
    model: bestValue(jsonLd.model, meta.model),
    description: bestValue(jsonLd.description, meta.description),
    imageUrl: bestValue(jsonLd.imageUrl, meta.imageUrl),
    price: jsonLd.price ?? meta.price,
    currency: jsonLd.currency ?? meta.currency,
    sku: jsonLd.sku,
    mpn: jsonLd.mpn,
    specs: jsonLd.specs ?? meta.specs,
  };
}

export function parseGearLinkHtml(html: string, sourceUrl: string): GearLinkPreview {
  const target = new URL(sourceUrl);
  const sourceHost = target.hostname.replace(/^www\./, "");
  const metadata = mergeMetadata(extractJsonLdProduct(html), extractMetaProduct(html));
  const fallbackText = stripTags(html).slice(0, 500);
  const rawName = cleanProductName(bestValue(metadata.name, getTitle(html), sourceHost));
  const priceText = metadata.price ? ` ${metadata.price}` : "";
  const draftFromText = parseGearCapture(`${rawName} ${metadata.brand ?? ""} ${metadata.model ?? ""}${priceText}`);
  const name = rawName || draftFromText.name;
  const brand = bestValue(metadata.brand, draftFromText.brand);
  const model = bestValue(metadata.model, draftFromText.model, name);
  const purchasePrice = priceToCents(metadata.price ?? null) ?? draftFromText.purchasePrice;
  const currency = normalizeCurrency(metadata.currency, String(metadata.price ?? ""));
  const category = validCategory(draftFromText.category);
  const description = bestValue(metadata.description, fallbackText).slice(0, 240);
  const specs = metadata.specs ?? {};
  const notes = [
    description ? `链接摘要：${description}` : "",
    metadata.imageUrl ? `商品图：${metadata.imageUrl}` : "",
    `来源链接：${target.toString()}`,
  ].filter(Boolean).join("\n");

  return {
    sourceUrl: target.toString(),
    sourceHost,
    title: name,
    description,
    imageUrl: metadata.imageUrl ?? "",
    rawText: [name, brand, model !== name ? model : "", purchasePrice ? String(purchasePrice / 100) : "", sourceHost]
      .filter(Boolean)
      .join(" "),
    draft: {
      name,
      brand,
      model,
      category,
      purchasePrice,
      currency,
      purchaseChannel: sourceHost,
      specs,
      notes,
    },
  };
}

export async function fetchGearLinkPreview(rawUrl: string): Promise<GearLinkPreview> {
  const initialTarget = await assertSafeUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let currentUrl = initialTarget.toString();
    let response: Response | null = null;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      response = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
          "User-Agent": "Mozilla/5.0 (compatible; LeonoteGearBot/1.0)",
        },
      });

      if (response.status >= 300 && response.status < 400 && response.headers.has("location")) {
        const nextUrl = new URL(response.headers.get("location")!, currentUrl).toString();
        await assertSafeUrl(nextUrl);
        currentUrl = nextUrl;
        continue;
      }
      break;
    }

    if (!response || !response.ok) throw new Error("链接内容不可访问");
    // Validate the response's resolved URL (not just currentUrl) to guard against
    // servers returning a different final URL after non-standard redirects
    const finalUrl = (await assertSafeUrl(response.url || currentUrl)).toString();
    const contentType = response.headers.get("content-type") || "";
    if (!ALLOWED_CONTENT_TYPES.some((type) => contentType.includes(type))) throw new Error("链接不是可读取的商品页面");

    const reader = response.body?.getReader();
    if (!reader) throw new Error("链接内容不可读取");
    const decoder = new TextDecoder();
    let html = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (html.length >= MAX_HTML_BYTES) break;
    }

    return parseGearLinkHtml(html.slice(0, MAX_HTML_BYTES), finalUrl);
  } finally {
    clearTimeout(timer);
  }
}
