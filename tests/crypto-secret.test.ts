import { describe, it, expect, beforeAll } from "vitest";
import {
  encryptSecret,
  decryptSecret,
} from "../src/lib/crypto-secret";

describe("encryptSecret / decryptSecret", () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = "test-secret-for-crypto-32chars";
  });

  it("encrypted value is not plaintext", () => {
    const plain = "sk-test-api-key-12345";
    const encrypted = encryptSecret(plain);
    expect(encrypted).not.toBe(plain);
    expect(encrypted).toContain("v1.");
  });

  it("round-trips correctly", () => {
    const plain = "sk-test-api-key-12345";
    const encrypted = encryptSecret(plain);
    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(plain);
  });

  it("handles empty string", () => {
    expect(encryptSecret("")).toBe("");
    expect(decryptSecret("")).toBe("");
  });

  it("passes through non-v1 values (compat)", () => {
    const legacy = "plaintext-key";
    expect(decryptSecret(legacy)).toBe(legacy);
  });
});
