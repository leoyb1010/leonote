import { prisma } from "@/lib/prisma";
import { generateBriefingDigest } from "./digest";
import { fetchNewsSources } from "./fetchers/rss";

type EnsureOptions = {
  force?: boolean;
  minItems?: number;
  maxAgeMinutes?: number;
  wait?: boolean;
  timeoutMs?: number;
};

type EnsureResult = {
  started: boolean;
  inFlight: boolean;
  skipped: boolean;
  timedOut?: boolean;
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
  if (!(await shouldRefresh(options))) {
    return { started: false, inFlight: false, skipped: true } satisfies EnsureResult;
  }

  const alreadyRunning = Boolean(inFlight);

  if (!inFlight) {
    inFlight = (async () => {
      try {
        await fetchNewsSources();
      } catch (error) {
        console.error("[briefing] background fetch failed", error instanceof Error ? error.message : "unknown");
      }

      try {
        await generateBriefingDigest();
      } catch (error) {
        console.error("[briefing] background digest failed", error instanceof Error ? error.message : "unknown");
      } finally {
        inFlight = null;
      }
    })();
  }

  if (options.wait) {
    const timedOut = await waitForRefresh(options.timeoutMs ?? 12_000);
    return {
      started: !alreadyRunning,
      inFlight: Boolean(inFlight),
      skipped: false,
      timedOut,
    } satisfies EnsureResult;
  }

  return {
    started: !alreadyRunning,
    inFlight: true,
    skipped: false,
  } satisfies EnsureResult;
}

async function waitForRefresh(timeoutMs: number) {
  if (!inFlight) return false;

  const timeout = new Promise<"timeout">((resolve) => {
    setTimeout(() => resolve("timeout"), timeoutMs);
  });
  const result = await Promise.race([inFlight.then(() => "done" as const), timeout]);
  return result === "timeout";
}
