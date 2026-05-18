const CACHE_NAME = "leonote-runtime-v20260518";
const STATIC_ASSETS = ["/manifest.json", "/favicon.ico", "/icon-192.png", "/icon-512.png", "/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/")) return;
  if (url.searchParams.has("_rsc")) return;
  if (req.headers.get("rsc") === "1") return;
  if (req.headers.get("next-router-prefetch")) return;
  if (req.headers.get("next-router-state-tree")) return;
  if (req.headers.get("accept")?.includes("text/x-component")) return;

  const acceptsHtml =
    req.headers.get("accept")?.includes("text/html");

  if (acceptsHtml) {
    event.respondWith(
      fetch(req).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return res;
      });
      return cached || fetchPromise;
    })
  );
});
