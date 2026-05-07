import crypto from "node:crypto";
import bcrypt from "bcryptjs";

export const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Host-leonote_session"
    : "leonote_session";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required");
  return secret;
}

function sign(payload: string) {
  return crypto
    .createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("base64url");
}

function signaturesMatch(expected: string, actual: string) {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createSessionValue(userId: string, tokenVersion: number) {
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${exp}.${tokenVersion}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function readSessionValue(raw?: string) {
  if (!raw) return null;
  const [userId, expRaw, , signature] = raw.split(".");
  if (!userId || !expRaw || !signature) return null;

  const parts = raw.split(".");
  if (parts.length < 4) return null;

  const payload = parts.slice(0, 3).join(".");
  if (!signaturesMatch(sign(payload), signature)) return null;

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;

  const tokenVersion = Number(parts[2]);
  if (!Number.isFinite(tokenVersion)) return null;

  return { userId, exp, tokenVersion };
}

export function getSessionCookieOptions(exp: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(exp),
  };
}
