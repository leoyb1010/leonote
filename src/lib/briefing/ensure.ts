import { prisma } from "@/lib/prisma";
import { generateBriefingDigest } from "./digest";
import { fetchNewsSources } from "./fetchers/rss";

type EnsureOptions = {
  force?: boolean;
  minItems?: number;
  maxAgeMinutes?: number;
};

let inFlight: Promise<void> | null = null;

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function todayWindow() {
  const today = startOfToday();
  return {
    OR: [
      { publishedAt: { gte: today } },
      { fetchedAt: { gte: today } },
    ],
  };
}

async function shouldRefresh(options: EnsureOptions) {
  if (options.force) return true;
  if (process.env.BRIEFING_AUTO_REFRESH === "false") return false;

  const minItems = options.minItems ?? Number(process.env.BRIEFING_MIN_ITEMS || 12);
  const maxAgeMinutes = options.maxAgeMinutes ?? Number(process.env.BRIEFING_MAX_AGE_MINUTES || 30);
  const [itemCount, latestSource, todayDigest] = await Promise.all([
    prisma.newsItem.count({ where: todayWindow() }),
    prisma.newsSource.findFirst({
      where: { enabled: true, lastFetchAt: { not: null } },
      orderBy: { lastFetchAt: "desc" },
      select: { lastFetchAt: true },
    }),
    prisma.briefingDigest.findUnique({
      where: { date: startOfToday() },
      select: { id: true },
    }),
  ]);

  const latestFetchAt = latestSource?.lastFetchAt?.getTime() ?? 0;
  const stale = !latestFetchAt || Date.now() - latestFetchAt > maxAgeMinutes * 60_000;
  return itemCount < minItems || stale || !todayDigest;
}

export async function ensureBriefingFreshness(options: EnsureOptions = {}) {
  if (!(await shouldRefresh(options))) return;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      await fetchNewsSources();
    } finally {
      await generateBriefingDigest();
      inFlight = null;
    }
  })();

  return inFlight;
}
