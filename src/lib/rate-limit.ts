type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// In-process fixed window rate limiter. Adequate for single-instance self-hosting.
// Limitations: counters reset on server restart; multi-instance deployments
// require shared storage (Redis / DB-backed limiter) to avoid split-brain.
// Periodic cleanup runs at 5000+ entries to bound memory growth.
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }

  // Periodic cleanup: remove expired entries when map grows large
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.resetAt < now) buckets.delete(k);
    }
  }

  return { ok: true };
}
