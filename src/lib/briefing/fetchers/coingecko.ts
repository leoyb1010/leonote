import https from "node:https";
import { HttpsProxyAgent } from "https-proxy-agent";
import { prisma } from "@/lib/prisma";

interface CoinData {
  usd: number;
  usd_24h_change: number;
}

const COINS = [
  { id: "bitcoin", symbol: "BTC-USD", name: "比特币", category: "crypto" },
  { id: "ethereum", symbol: "ETH-USD", name: "以太坊", category: "crypto" },
];

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      agent: proxyAgent,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      res.on("error", reject);
    }).on("error", reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error("timeout")); });
  });
}

async function getPoints(symbol: string, newPrice: number): Promise<number[]> {
  const latest = await prisma.marketSnapshot.findMany({
    where: { symbol },
    orderBy: { capturedAt: "desc" },
    take: 23,
    select: { price: true },
  });
  return [...latest.map((item) => item.price).reverse(), newPrice].slice(-24);
}

export async function fetchCryptoSnapshots() {
  const ids = COINS.map((c) => c.id).join(",");
  const raw = await httpGet(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
  );
  const json = JSON.parse(raw) as Record<string, CoinData>;

  const writes: Array<ReturnType<typeof prisma.marketSnapshot.create>> = [];

  for (const coin of COINS) {
    const data = json[coin.id];
    if (!data?.usd) continue;
    const price = data.usd;
    const changePct = data.usd_24h_change ?? 0;
    const points = await getPoints(coin.symbol, price);
    writes.push(prisma.marketSnapshot.create({
      data: {
        symbol: coin.symbol, name: coin.name, category: coin.category,
        price,
        changeAbs: price * (changePct / 100),
        changePct,
        pointsJson: JSON.stringify(points),
      },
    }));
  }

  // Forex via exchangerate-api
  try {
    const forexRaw = await httpGet("https://api.exchangerate-api.com/v4/latest/USD");
    const forexJson = JSON.parse(forexRaw);
    const rate = forexJson.rates?.CNY as number;
    if (rate > 0) {
      const prev = await prisma.marketSnapshot.findFirst({
        where: { symbol: "USD-CNY" },
        orderBy: { capturedAt: "desc" },
        select: { price: true },
      });
      const prevPrice = prev?.price ?? rate;
      const changePct = prevPrice ? ((rate - prevPrice) / prevPrice) * 100 : 0;
      const points = await getPoints("USD-CNY", rate);
      writes.push(prisma.marketSnapshot.create({
        data: {
          symbol: "USD-CNY", name: "美元/人民币", category: "fx",
          price: rate,
          changeAbs: rate * (changePct / 100),
          changePct,
          pointsJson: JSON.stringify(points),
        },
      }));
    }
  } catch {
    // forex is optional
  }

  if (writes.length > 0) await prisma.$transaction(writes);
  return { count: writes.length };
}
