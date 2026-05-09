import { getLatestMarketSnapshots } from "./query";
import { fetchCryptoSnapshots } from "./fetchers/coingecko";
import { fetchSinaMarketSnapshots } from "./fetchers/sina-market";
import type { MarketSnapshotDTO } from "./types";

const DEFAULT_MAX_AGE_MS = 60_000;

let refreshInFlight: Promise<void> | null = null;

function latestCapturedAt(markets: MarketSnapshotDTO[]) {
  return markets.reduce<number | null>((latest, item) => {
    const value = new Date(item.capturedAt).getTime();
    if (!Number.isFinite(value)) return latest;
    return latest == null || value > latest ? value : latest;
  }, null);
}

function shouldRefresh(markets: MarketSnapshotDTO[], maxAgeMs: number) {
  const latest = latestCapturedAt(markets);
  if (latest == null) return true;
  return Date.now() - latest > maxAgeMs;
}

async function refreshMarketSnapshots() {
  if (!refreshInFlight) {
    refreshInFlight = Promise.allSettled([
      fetchSinaMarketSnapshots(),
      fetchCryptoSnapshots(),
    ])
      .then((results) => {
        if (results.every((result) => result.status === "rejected")) {
          const reason = results.find((result) => result.status === "rejected")?.reason;
          throw reason instanceof Error ? reason : new Error("market refresh failed");
        }
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

export async function getLiveMarketSnapshots(options?: { force?: boolean; maxAgeMs?: number }) {
  const maxAgeMs = options?.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
  const existing = await getLatestMarketSnapshots();

  if (options?.force || shouldRefresh(existing, maxAgeMs)) {
    try {
      await refreshMarketSnapshots();
    } catch (error) {
      const fallback = existing.length > 0 ? existing : await getLatestMarketSnapshots();
      return {
        markets: fallback,
        refreshed: false,
        stale: fallback.length > 0,
        error: error instanceof Error ? error.message : "market refresh failed",
      };
    }
  }

  return {
    markets: await getLatestMarketSnapshots(),
    refreshed: options?.force || shouldRefresh(existing, maxAgeMs),
    stale: false,
    error: null,
  };
}
