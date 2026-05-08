import { prisma } from "@/lib/prisma";
import { MARKET_SYMBOLS } from "../sources";

interface YahooQuote {
  symbol: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
}

function toNumber(value: unknown, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

async function fetchYahooQuotes(symbols: string[]) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(","))}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "LeonoteBriefing/1.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Yahoo quote failed: ${res.status}`);
  const json = await res.json();
  return (json.quoteResponse?.result ?? []) as YahooQuote[];
}

export async function fetchMarketSnapshots() {
  const quotes = await fetchYahooQuotes(MARKET_SYMBOLS.map((item) => item.symbol));
  const quoteMap = new Map(quotes.map((quote) => [quote.symbol, quote]));

  const writes = [];

  for (const meta of MARKET_SYMBOLS) {
    const quote = quoteMap.get(meta.symbol);
    if (!quote) continue;

    const latest = await prisma.marketSnapshot.findMany({
      where: { symbol: meta.symbol },
      orderBy: { capturedAt: "desc" },
      take: 23,
      select: { price: true },
    });

    const price = toNumber(quote.regularMarketPrice);
    const points = [...latest.map((item) => item.price).reverse(), price].slice(-24);

    writes.push(
      prisma.marketSnapshot.create({
        data: {
          symbol: meta.symbol,
          name: meta.name,
          category: meta.category,
          price,
          changeAbs: toNumber(quote.regularMarketChange),
          changePct: toNumber(quote.regularMarketChangePercent),
          pointsJson: JSON.stringify(points),
        },
      }),
    );
  }

  await prisma.$transaction(writes);
  return { count: writes.length };
}
