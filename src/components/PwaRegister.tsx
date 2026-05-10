"use client";

import { useEffect } from "react";

const CHUNK_RECOVERY_PREFIX = "leonote.chunk-reload";

function getErrorText(reason: unknown): string {
  if (reason instanceof Error) {
    return `${reason.name} ${reason.message} ${reason.stack ?? ""}`;
  }
  if (typeof reason === "string") return reason;
  if (reason && typeof reason === "object") {
    const maybeError = reason as { message?: unknown; reason?: unknown; error?: unknown };
    return [
      typeof maybeError.message === "string" ? maybeError.message : "",
      getErrorText(maybeError.reason),
      getErrorText(maybeError.error),
    ].join(" ");
  }
  return "";
}

function isRouteChunkLoadFailure(reason: unknown) {
  const text = getErrorText(reason);
  if (!text) return false;
  return (
    /ChunkLoadError|Loading chunk \S+ failed|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(text) ||
    (/_next\/static|webpack|chunk|module script/i.test(text) && /failed|error|abort|load/i.test(text))
  );
}

function reloadOnceForChunkFailure() {
  try {
    const key = `${CHUNK_RECOVERY_PREFIX}:${window.location.pathname}`;
    if (window.sessionStorage.getItem(key) === "1") return;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // If sessionStorage is unavailable, a single reload is still safer than a blank route.
  }
  window.location.reload();
}

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;
    const reloadOnControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", reloadOnControllerChange);

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      void registration.update();

      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      registration.addEventListener("updatefound", () => {
        const nextWorker = registration.installing;
        if (!nextWorker) return;

        nextWorker.addEventListener("statechange", () => {
          if (nextWorker.state === "installed" && navigator.serviceWorker.controller) {
            nextWorker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    }).catch(() => {
        // Silent fail - SW is progressive enhancement
      });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", reloadOnControllerChange);
    };
  }, []);

  return null;
}

export function ClientRuntimeRecovery() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      if (isRouteChunkLoadFailure(event.error || event.message)) {
        reloadOnceForChunkFailure();
      }
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isRouteChunkLoadFailure(event.reason)) {
        reloadOnceForChunkFailure();
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
