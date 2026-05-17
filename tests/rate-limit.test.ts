import { afterEach, describe, it, expect } from "vitest";
import { checkRateLimit } from "../src/lib/rate-limit";
import { getClientRateLimitKey } from "../src/lib/request-guard";

describe("checkRateLimit", () => {
  it("allows requests under limit", () => {
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(`test:${Date.now()}:${i}`, 10, 60_000);
      expect(result.ok).toBe(true);
    }
  });

  it("blocks requests over limit", () => {
    const key = `block-test-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit(key, 2, 60_000);
      if (i < 2) {
        expect(result.ok).toBe(true);
      } else {
        expect(result.ok).toBe(false);
        expect(result.retryAfterMs).toBeGreaterThan(0);
      }
    }
  });

  it("returns retryAfterMs when blocked", () => {
    const key = `retry-test-${Date.now()}`;
    checkRateLimit(key, 1, 60_000);
    const result = checkRateLimit(key, 1, 60_000);
    expect(result.ok).toBe(false);
    expect(typeof result.retryAfterMs).toBe("number");
  });
});

describe("getClientRateLimitKey", () => {
  const originalTrustProxy = process.env.LEONOTE_TRUST_PROXY_HEADERS;

  afterEach(() => {
    if (originalTrustProxy === undefined) {
      delete process.env.LEONOTE_TRUST_PROXY_HEADERS;
    } else {
      process.env.LEONOTE_TRUST_PROXY_HEADERS = originalTrustProxy;
    }
  });

  it("ignores spoofable proxy headers unless explicitly trusted", () => {
    process.env.LEONOTE_TRUST_PROXY_HEADERS = "false";
    const headers = new Headers({ "x-forwarded-for": "203.0.113.10" });
    expect(getClientRateLimitKey(headers)).toBe("direct");
  });

  it("uses proxy client IP only when the deployment opts in", () => {
    process.env.LEONOTE_TRUST_PROXY_HEADERS = "true";
    const headers = new Headers({ "x-forwarded-for": "203.0.113.10, 10.0.0.1" });
    expect(getClientRateLimitKey(headers)).toBe("203.0.113.10");
  });
});
