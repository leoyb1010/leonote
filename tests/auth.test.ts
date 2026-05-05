import { describe, it, expect, beforeAll } from "vitest";
import {
  createSessionValue,
  readSessionValue,
} from "../src/lib/auth";
import crypto from "node:crypto";

describe("readSessionValue", () => {
  beforeAll(() => {
    process.env.AUTH_SECRET = "test-secret-key-32-chars-minimum!!";
  });

  it("returns null for empty/undefined input", () => {
    expect(readSessionValue()).toBeNull();
    expect(readSessionValue("")).toBeNull();
  });

  it("returns null for tampered signature", () => {
    const token = createSessionValue("user1", 0);
    const parts = token.split(".");
    const tampered = `${parts[0]}.${parts[1]}.${parts[2]}.wrongsig`;
    expect(readSessionValue(tampered)).toBeNull();
  });

  it("reads a valid token correctly", () => {
    const token = createSessionValue("user1", 0);
    const result = readSessionValue(token);
    expect(result).not.toBeNull();
    expect(result!.userId).toBe("user1");
    expect(result!.tokenVersion).toBe(0);
  });

  it("returns null for expired token", () => {
    const secret = process.env.AUTH_SECRET || "test";
    const exp = Date.now() - 1000;
    const payload = `user1.${exp}.0`;
    const sig = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("base64url");
    const token = `${payload}.${sig}`;
    expect(readSessionValue(token)).toBeNull();
  });

  it("reads correct tokenVersion from token", () => {
    const token = createSessionValue("user1", 5);
    const result = readSessionValue(token);
    expect(result).not.toBeNull();
    expect(result!.tokenVersion).toBe(5);
  });
});
