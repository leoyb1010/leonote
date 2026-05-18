"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export const CHUNK_RECOVERY_PREFIX = "leonote.chunk-reload";

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
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      void registration.update();

      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
      }

      registration.addEventListener("updatefound", () => {
        const nextWorker = registration.installing;
        if (!nextWorker) return;

        nextWorker.addEventListener("statechange", () => {
          if (nextWorker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(nextWorker);
          }
        });
      });
    }).catch(() => {
        // Silent fail - SW is progressive enhancement
      });

  }, []);

  if (!waitingWorker) return null;

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-[90] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)] shadow-[var(--shadow-md)] md:bottom-5">
      <span>Leonote 有新版本。</span>
      <button
        type="button"
        onClick={() => {
          waitingWorker.postMessage({ type: "SKIP_WAITING" });
          window.location.reload();
        }}
        className="shrink-0 rounded-lg bg-[var(--text-primary)] px-3 py-1.5 font-medium text-[var(--bg-app)]"
      >
        更新
      </button>
    </div>
  );
}

export function ClientRuntimeRecovery() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      window.sessionStorage.removeItem(`${CHUNK_RECOVERY_PREFIX}:${pathname}`);
    } catch {
      // Session storage is optional.
    }
  }, [pathname]);

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
