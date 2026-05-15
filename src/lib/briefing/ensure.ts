import { prisma } from "@/lib/prisma";
import { generateBriefingDigest } from "./digest";
import { fetchNewsSources } from "./fetchers/rss";
import { fetchXSignals } from "./fetchers/x-api";

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
  coldStart?: boolean;
};

type RefreshDecision = {
  refresh: boolean;
  coldStart: boolean;
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

async function getRefreshDecision(options: EnsureOptions): Promise<RefreshDecision> {
  const minItems = options.minItems ?? Number(process.env.BRIEFING_MIN_ITEMS || 24);
  const maxAgeMinutes = options.maxAgeMinutes ?? Number(process.env.BRIEFING_MAX_AGE_MINUTES || 5);
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

  if (process.env.BRIEFING_AUTO_REFRESH === "false" && !options.force) {
    return { refresh: false, coldStart: false };
  }

  const coldStart = itemCount === 0 && !todayDigest;
  if (options.force) return { refresh: true, coldStart };

  const latestFetchAt = latestSource?.lastFetchAt?.getTime() ?? 0;
  const stale = !latestFetchAt || Date.now() - latestFetchAt > maxAgeMinutes * 60_000;
  return {
    refresh: itemCount < minItems || stale || !todayDigest,
    coldStart,
  };
}

export async function ensureBriefingFreshness(options: EnsureOptions = {}) {
  const decision = await getRefreshDecision(options);
  if (!decision.refresh) {
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
        await fetchXSignals();
      } catch (error) {
        console.error("[briefing] background X fetch failed", error instanceof Error ? error.message : "unknown");
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

  const shouldWait = options.wait || decision.coldStart;

  if (shouldWait) {
    const timedOut = await waitForRefresh(options.timeoutMs ?? (decision.coldStart ? 18_000 : 12_000));
    return {
      started: !alreadyRunning,
      inFlight: Boolean(inFlight),
      skipped: false,
      timedOut,
      coldStart: decision.coldStart,
    } satisfies EnsureResult;
  }

  return {
    started: !alreadyRunning,
    inFlight: true,
    skipped: false,
    coldStart: decision.coldStart,
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
