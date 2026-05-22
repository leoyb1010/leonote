"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, CameraOff, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  uploading?: boolean;
  onClose: () => void;
  onCaptured: (file: File) => void | Promise<void>;
};

export function CameraCaptureModal({ open, uploading = false, onClose, onCaptured }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retryToken, setRetryToken] = useState(0);

  const stopStream = (current: MediaStream | null) => {
    current?.getTracks().forEach((track) => track.stop());
  };

  // Camera lifecycle is driven by the `open` prop. The setState calls below
  // sync React state with the platform getUserMedia API (an external system),
  // which is the documented legitimate use of effects.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) {
      setStream((current) => {
        stopStream(current);
        return null;
      });
      setLoading(false);
      setError("");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      fallbackInputRef.current?.click();
      return;
    }

    let cancelled = false;
    let active: MediaStream | null = null;
    setError("");
    setLoading(true);

    (async () => {
      try {
        const next = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1600 },
            height: { ideal: 1200 },
          },
        });
        if (cancelled) {
          stopStream(next);
          return;
        }
        active = next;
        setStream(next);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "无法打开摄像头，请检查浏览器权限。");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      stopStream(active);
    };
  }, [open, retryToken]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!stream || !videoRef.current) return;
    videoRef.current.srcObject = stream;
    void videoRef.current.play().catch(() => {
      setError("摄像头已打开，但预览启动失败，请重试。");
    });
  }, [stream]);

  const capture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      setError("摄像头画面还没有准备好，请稍等一秒再拍。");
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setError("无法读取摄像头画面。");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.92);
    });
    if (!blob) {
      setError("照片生成失败，请重试。");
      return;
    }
    const file = new File([blob], `camera-${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`, {
      type: "image/jpeg",
    });
    onClose();
    await onCaptured(file);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-[var(--overlay-scrim)] px-3 pb-3 pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.section
            className="floating-card-premium flex max-h-[calc(100dvh-24px)] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-2xl)]"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--hairline)] px-4 py-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Camera className="h-3.5 w-3.5" />
                  系统摄像头
                </div>
                <h3 className="mt-1 text-sm font-medium text-[var(--text-primary)]">拍照并插入正文</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--hairline)] text-[var(--text-muted)] transition hover:bg-[var(--interactive-hover)] hover:text-[var(--text-primary)]"
                aria-label="关闭摄像头"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-black">
                <video ref={videoRef} muted playsInline autoPlay className="aspect-[4/3] w-full object-cover" />
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-white">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在打开摄像头
                  </div>
                ) : null}
                {!stream && !loading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 px-6 text-center text-sm leading-6 text-white/80">
                    <CameraOff className="mb-2 h-5 w-5" />
                    {error || "摄像头尚未连接。"}
                  </div>
                ) : null}
              </div>
              {error ? (
                <p className="mt-3 rounded-[var(--radius-lg)] border border-[var(--danger-soft)] bg-[var(--material-inset)] px-3 py-2 text-xs leading-5 text-[var(--text-secondary)]">
                  {error}
                </p>
              ) : null}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[var(--hairline)] px-4 py-3">
              <button
                type="button"
                onClick={() => fallbackInputRef.current?.click()}
                className="rounded-full border border-[var(--hairline)] px-3 py-2 text-xs text-[var(--text-secondary)] transition hover:bg-[var(--interactive-hover)]"
              >
                选择照片
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStream((current) => {
                      stopStream(current);
                      return null;
                    });
                    setRetryToken((t) => t + 1);
                  }}
                  disabled={loading}
                  className="rounded-full border border-[var(--hairline)] px-3 py-2 text-xs text-[var(--text-secondary)] transition hover:bg-[var(--interactive-hover)] disabled:opacity-50"
                >
                  重新打开
                </button>
                <button
                  type="button"
                  onClick={() => void capture()}
                  disabled={!stream || uploading}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--text-primary)] px-4 py-2 text-xs font-medium text-[var(--surface-base)] transition hover:opacity-90 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                  插入正文
                </button>
              </div>
            </footer>
            <input
              ref={fallbackInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                event.target.value = "";
                onClose();
                if (files[0]) void onCaptured(files[0]);
              }}
            />
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
