import crypto from "node:crypto";

function getKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for secret encryption");
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(plain: string) {
  if (!plain) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(value: string): string | null {
  if (!value) return "";
  if (!value.startsWith("v1.")) {
    // Non-encrypted values may be plaintext API keys stored before encryption was
    // introduced. Warn and return null to avoid exposing them as-is.
    console.warn("[crypto-secret] decryptSecret called with non-v1 value — returning null to avoid exposing plaintext secrets");
    return null;
  }
  const [, ivRaw, tagRaw, dataRaw] = value.split(".");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivRaw, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
