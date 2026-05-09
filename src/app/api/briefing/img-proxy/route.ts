import { NextResponse } from "next/server";
import https from "node:https";
import http from "node:http";
import { lookup } from "node:dns/promises";
import net from "node:net";
import { HttpsProxyAgent } from "https-proxy-agent";
import { getSessionUserId } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 8000;
const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
]);
const ALLOWED_CONTENT_TYPES = new Set([
  "image/avif",
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/x-icon",
]);

function isBlockedIp(ip: string) {
  if (net.isIP(ip) === 4) {
    return (
      ip === "0.0.0.0" ||
      ip.startsWith("10.") ||
      ip.startsWith("127.") ||
      ip.startsWith("169.254.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
      ip.startsWith("192.168.")
    );
  }

  if (net.isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    return (
      lower === "::" ||
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe80") ||
      lower.startsWith("::ffff:127.") ||
      lower.startsWith("::ffff:10.") ||
      lower.startsWith("::ffff:192.168.") ||
      /^::ffff:172\.(1[6-9]|2\d|3[01])\./.test(lower)
    );
  }

  return false;
}

async function assertSafeImageUrl(raw: string) {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("invalid url");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("unsupported protocol");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    BLOCKED_HOSTS.has(hostname) ||
    hostname.endsWith(".localhost") ||
    isBlockedIp(hostname)
  ) {
    throw new Error("blocked host");
  }

  const resolved = await lookup(hostname, { all: true });
  if (!resolved.length || resolved.some((item) => isBlockedIp(item.address))) {
    throw new Error("blocked address");
  }

  return parsed.toString();
}

function normalizeContentType(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? "").split(";")[0]?.trim().toLowerCase() ?? "";
}

async function fetchImage(fetchUrl: string, redirects = 0): Promise<{ buffer: Buffer; contentType: string }> {
  if (redirects > MAX_REDIRECTS) throw new Error("too many redirects");
  const safeUrl = await assertSafeImageUrl(fetchUrl);
  const mod = safeUrl.startsWith("https://") ? https : http;

  return new Promise((resolve, reject) => {
    const req = mod.get(safeUrl, {
      agent: proxyAgent,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "image/*" },
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        const next = new URL(res.headers.location, safeUrl).toString();
        fetchImage(next, redirects + 1).then(resolve, reject);
        return;
      }
      if (!res.statusCode || res.statusCode >= 400) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const contentType = normalizeContentType(res.headers["content-type"]);
      if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
        res.resume();
        reject(new Error("unsupported content type"));
        return;
      }

      const contentLength = Number(res.headers["content-length"] ?? "0");
      if (Number.isFinite(contentLength) && contentLength > MAX_IMAGE_BYTES) {
        res.resume();
        reject(new Error("image too large"));
        return;
      }

      const chunks: Buffer[] = [];
      let received = 0;
      res.on("data", (chunk) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        received += buffer.length;
        if (received > MAX_IMAGE_BYTES) {
          req.destroy(new Error("image too large"));
          return;
        }
        chunks.push(buffer);
      });
      res.on("end", () => resolve({ buffer: Buffer.concat(chunks), contentType }));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error("timeout"));
    });
  });
}

const FALLBACK_PNG = new Uint8Array(Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
));

function fallbackImage() {
  return new NextResponse(FALLBACK_PNG, {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-cache" },
  });
}

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return fallbackImage();

  const rate = checkRateLimit(`img-proxy:${userId}`, 240, 60_000);
  if (!rate.ok) return fallbackImage();

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url || (!url.startsWith("https://") && !url.startsWith("http://"))) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  try {
    const { buffer, contentType } = await fetchImage(url);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return fallbackImage();
  }
}
