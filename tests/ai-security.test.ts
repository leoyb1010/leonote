import { describe, expect, it } from "vitest";
import { assertSafeAIBaseUrl } from "../src/lib/ai";

describe("assertSafeAIBaseUrl", () => {
  it("allows known https AI providers and preserves base paths", () => {
    expect(assertSafeAIBaseUrl("https://api.openai.com/v1/")).toBe("https://api.openai.com/v1");
    expect(assertSafeAIBaseUrl("https://api.deepseek.com")).toBe("https://api.deepseek.com");
  });

  it("rejects localhost and metadata-service style URLs", () => {
    expect(() => assertSafeAIBaseUrl("http://localhost:5432")).toThrow(/https/);
    expect(() => assertSafeAIBaseUrl("https://169.254.169.254/latest/meta-data")).toThrow(/允许列表/);
  });
});
