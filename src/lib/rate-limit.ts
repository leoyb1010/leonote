type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// In-process fixed window rate limiter. Adequate for single-instance self-hosting.
// Limitations: counters reset on server restart; multi-instance deployments
// require shared storage (Redis / DB-backed limiter) to avoid split-brain.
// RECOMMENDATION: For multi-instance/production deployments, replace this with a
// Redis-backed rate limiter (e.g., using ioredis + sliding window or token bucket).
// Periodic cleanup runs at 5000+ entries to bound memory growth.
// TODO: For multi-instance / production scale-out, replace with Redis-backed
// sliding-window limiter (e.g. @upstash/ratelimit) or DB-backed counter.
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
  if (bucket.count >= limit) {
    return { ok: false, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count += 1;

  // Periodic cleanup: remove expired entries when map grows large
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.resetAt < now) buckets.delete(k);
    }
  }

  return { ok: true };
}
