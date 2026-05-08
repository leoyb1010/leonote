export function proxyImageUrl(url: string | null): string | null {
  if (!url) return null;
  return `/api/briefing/img-proxy?url=${encodeURIComponent(url)}`;
}
