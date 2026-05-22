import { lookup } from "node:dns/promises";
import net from "node:net";

const DEFAULT_MAX_REDIRECTS = 5;
const METADATA_HOSTS = new Set([
  "metadata",
  "metadata.google.internal",
  "169.254.169.254",
]);
const LOCAL_HOSTS = new Set(["localhost", "localhost.localdomain", "0.0.0.0", "::1"]);

export type SafeUrlOptions = {
  allowHttp?: boolean;
  maxRedirects?: number;
};

function ipv4ToNumber(ip: string) {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

function isIpv4InRange(ip: string, base: string, bits: number) {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipv4ToNumber(ip) & mask) === (ipv4ToNumber(base) & mask);
}

export function isBlockedIp(ip: string): boolean {
  if (net.isIP(ip) === 4) {
    return [
      ["0.0.0.0", 8],
      ["10.0.0.0", 8],
      ["100.64.0.0", 10],
      ["127.0.0.0", 8],
      ["169.254.0.0", 16],
      ["172.16.0.0", 12],
      ["192.0.0.0", 24],
      ["192.0.2.0", 24],
      ["192.168.0.0", 16],
      ["198.18.0.0", 15],
      ["198.51.100.0", 24],
      ["203.0.113.0", 24],
      ["224.0.0.0", 4],
      ["240.0.0.0", 4],
    ].some(([base, bits]) => isIpv4InRange(ip, String(base), Number(bits)));
  }

  if (net.isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    if (lower.startsWith("::ffff:")) {
      const mapped = lower.slice("::ffff:".length);
      return net.isIP(mapped) === 4 ? isBlockedIp(mapped) : true;
    }
    return (
      lower === "::" ||
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe80") ||
      lower.startsWith("ff")
    );
  }

  return true;
}

function normalizeHostname(hostname: string) {
  return hostname.replace(/^\[|\]$/g, "").toLowerCase();
}

export async function assertSafePublicUrl(raw: string, options: SafeUrlOptions = {}) {
  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    throw new Error("URL 格式不合法");
  }

  const allowedProtocols = options.allowHttp ? ["http:", "https:"] : ["https:"];
  if (!allowedProtocols.includes(target.protocol)) {
    throw new Error(options.allowHttp ? "仅支持 http/https URL" : "仅支持 https URL");
  }

  if (target.username || target.password) throw new Error("URL 不允许包含用户名或密码");

  const hostname = normalizeHostname(target.hostname);
  if (!hostname || LOCAL_HOSTS.has(hostname) || METADATA_HOSTS.has(hostname) || hostname.endsWith(".localhost")) {
    throw new Error("不允许访问本地、内网或 metadata 地址");
  }

  if (net.isIP(hostname)) {
    if (isBlockedIp(hostname)) throw new Error("不允许访问本地、内网或保留地址");
    return target;
  }

  const resolved = await lookup(hostname, { all: true, verbatim: true });
  if (!resolved.length || resolved.some((item) => isBlockedIp(item.address))) {
    throw new Error("不允许访问本地、内网或保留地址");
  }

  return target;
}

export async function safeFetch(raw: string, init: RequestInit = {}, options: SafeUrlOptions = {}) {
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  let target = await assertSafePublicUrl(raw, options);

  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    const response = await fetch(target.toString(), { ...init, redirect: "manual" });
    if (![301, 302, 303, 307, 308].includes(response.status)) return { response, url: target };

    if (redirects === maxRedirects) throw new Error("跳转次数过多");
    const location = response.headers.get("location");
    if (!location) throw new Error("跳转响应缺少 Location");
    target = await assertSafePublicUrl(new URL(location, target).toString(), options);
  }

  throw new Error("跳转次数过多");
}
