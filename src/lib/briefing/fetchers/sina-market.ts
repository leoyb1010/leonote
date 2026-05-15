import { prisma } from "@/lib/prisma";

interface SinaQuote {
  symbol: string;
  name: string;
  category: string;
  price: number;
  changePct: number;
  changeAbs: number;
}

const MARKET_ITEMS: Array<{ symbol: string; name: string; category: string; kind: string }> = [
  // Chinese indices
  { symbol: "sh000001", name: "上证指数", category: "index_cn", kind: "cn" },
  { symbol: "sz399001", name: "深证成指", category: "index_cn", kind: "cn" },
  // International indices
  { symbol: "hkHSI", name: "恒生指数", category: "index_global", kind: "hk" },
  { symbol: "gb_ixic", name: "纳斯达克", category: "index_global", kind: "us" },
  // Precious metals and energy futures
  { symbol: "hf_XAU", name: "黄金", category: "metal", kind: "hf" },
  { symbol: "hf_XAG", name: "白银", category: "metal", kind: "hf" },
  { symbol: "hf_CL", name: "原油", category: "energy", kind: "hf" },
];

function toNumber(value: string, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function parseSinaLine(raw: string, symbol: string): SinaQuote | null {
  const re = new RegExp(`hq_str_${symbol}="([^"]*)"`);
  const match = raw.match(re);
  if (!match) return null;
  const fields = match[1].split(",");

  const meta = MARKET_ITEMS.find((s) => s.symbol === symbol);
  if (!meta) return null;

  try {
    if (meta.kind === "cn") {
      // Chinese index: name, open, prevClose, current, high, low
      const current = toNumber(fields[3]);
      const prevClose = toNumber(fields[2]);
      return {
        symbol, name: meta.name, category: meta.category,
        price: current,
        changeAbs: current - prevClose,
        changePct: prevClose ? ((current - prevClose) / prevClose) * 100 : 0,
      };
    }

    if (meta.kind === "hk") {
      // HK index: code, name, open, prevClose, current, low, high, changeAbs, changePct
      return {
        symbol, name: meta.name, category: meta.category,
        price: toNumber(fields[4]),
        changeAbs: toNumber(fields[7]),
        changePct: toNumber(fields[8]),
      };
    }

    if (meta.kind === "us") {
      // US index: name, current, changePct, time, changeAbs
      return {
        symbol, name: meta.name, category: meta.category,
        price: toNumber(fields[1]),
        changePct: toNumber(fields[2]),
        changeAbs: toNumber(fields[4]),
      };
    }

    if (meta.kind === "hf") {
      // Futures: current, prevSettle, open, high, low, ...
      const current = toNumber(fields[0]);
      const prevSettle = toNumber(fields[1]);
      return {
        symbol, name: meta.name, category: meta.category,
        price: current,
        changeAbs: current - prevSettle,
        changePct: prevSettle ? ((current - prevSettle) / prevSettle) * 100 : 0,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function fetchSinaMarketSnapshots() {
  const symbols = MARKET_ITEMS.map((s) => s.symbol).join(",");
  const res = await fetch(`https://hq.sinajs.cn/list=${symbols}`, {
    headers: { Referer: "https://finance.sina.com.cn" },
  });

  if (!res.ok) throw new Error(`Sina fetch failed: ${res.status}`);
  const text = await res.text();

  const writes = [];

  for (const meta of MARKET_ITEMS) {
    const quote = parseSinaLine(text, meta.symbol);
    if (!quote || quote.price === 0) continue;

    const latest = await prisma.marketSnapshot.findMany({
      where: { symbol: meta.symbol },
      orderBy: { capturedAt: "desc" },
      take: 23,
      select: { price: true },
    });

    const points = [...latest.map((item) => item.price).reverse(), quote.price].slice(-24);

    writes.push(
      prisma.marketSnapshot.create({
        data: {
          symbol: meta.symbol,
          name: meta.name,
          category: meta.category,
          price: quote.price,
          changeAbs: quote.changeAbs,
          changePct: quote.changePct,
          pointsJson: JSON.stringify(points),
        },
      }),
    );
  }

  if (writes.length === 0) throw new Error("No market data parsed from Sina");
  await prisma.$transaction(writes);
  return { count: writes.length };
}
