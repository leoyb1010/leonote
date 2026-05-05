import { describe, it, expect } from "vitest";
import { checkRateLimit } from "../src/lib/rate-limit";

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
