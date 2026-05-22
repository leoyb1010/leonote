import { describe, expect, it, vi } from "vitest";
import { assertSafePublicUrl } from "../src/lib/safe-url";

vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async (hostname: string) => {
    if (hostname === "example.com") return [{ address: "93.184.216.34", family: 4 }];
    if (hostname === "private.example") return [{ address: "10.0.0.1", family: 4 }];
    if (hostname === "metadata.example") return [{ address: "169.254.169.254", family: 4 }];
    return [{ address: "127.0.0.1", family: 4 }];
  }),
}));

describe("assertSafePublicUrl", () => {
  it("allows public https urls", async () => {
    await expect(assertSafePublicUrl("https://example.com/v1")).resolves.toBeInstanceOf(URL);
  });

  it("blocks http by default", async () => {
    await expect(assertSafePublicUrl("http://example.com")).rejects.toThrow("https");
  });

  it("can allow public http when explicitly enabled", async () => {
    await expect(assertSafePublicUrl("http://example.com", { allowHttp: true })).resolves.toBeInstanceOf(URL);
  });

  it("blocks localhost, private and metadata addresses", async () => {
    await expect(assertSafePublicUrl("https://localhost")).rejects.toThrow();
    await expect(assertSafePublicUrl("https://private.example")).rejects.toThrow();
    await expect(assertSafePublicUrl("https://metadata.example")).rejects.toThrow();
    await expect(assertSafePublicUrl("https://[::ffff:192.168.1.1]")).rejects.toThrow();
  });
});
