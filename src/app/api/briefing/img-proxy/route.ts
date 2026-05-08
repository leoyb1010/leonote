import { NextResponse } from "next/server";
import https from "node:https";
import http from "node:http";
import { HttpsProxyAgent } from "https-proxy-agent";

export const runtime = "nodejs";

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const proxyAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

function fetchImage(fetchUrl: string, redirects = 0): Promise<Buffer> {
  if (redirects > 3) return Promise.reject(new Error("too many redirects"));
  const mod = fetchUrl.startsWith("https://") ? https : http;

  return new Promise((resolve, reject) => {
    const req = mod.get(fetchUrl, {
      agent: proxyAgent,
      headers: { "User-Agent": "Mozilla/5.0", Accept: "image/*" },
    }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = new URL(res.headers.location, fetchUrl).toString();
        fetchImage(next, redirects + 1).then(resolve, reject);
        return;
      }
      if (!res.statusCode || res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error("timeout")); });
  });
}

function getContentType(url: string): string {
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
    bmp: "image/bmp", ico: "image/x-icon",
  };
  return map[ext ?? ""] ?? "image/jpeg";
}

const FALLBACK_PNG = new Uint8Array(Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url || (!url.startsWith("https://") && !url.startsWith("http://"))) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  try {
    const buffer = await fetchImage(url);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": getContentType(url),
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new NextResponse(FALLBACK_PNG, {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-cache" },
    });
  }
}
