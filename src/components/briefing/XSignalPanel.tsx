import { RadioTower, RefreshCw } from "lucide-react";
import type { BriefingXSignalDTO } from "@/lib/briefing/types";

type DetailAnchor = { top: number; left: number; width: number; height: number; x?: number; y?: number };

interface Props {
  signals: BriefingXSignalDTO[];
  updatedAt: string | null;
  onOpenSignal: (signal: BriefingXSignalDTO, anchor: DetailAnchor) => void;
}

function formatTime(input: string | null) {
  if (!input) return "待配置";
  return new Date(input).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(input: string) {
  const delta = Date.now() - new Date(input).getTime();
  const minutes = Math.max(1, Math.floor(delta / 60_000));
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

export function XSignalPanel({ signals, updatedAt, onOpenSignal }: Props) {
  return (
    <section className="card-premium p-4 lg:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] uppercase text-[var(--text-muted)]">
            <RadioTower size={13} />
            X Signals
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">关键人物 X 信号</h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2 py-1 text-[11px] text-[var(--text-muted)]">
          <RefreshCw size={11} />
          {formatTime(updatedAt)}
        </span>
      </div>

      {signals.length === 0 ? (
        <div className="quiet-inset rounded-[var(--radius-lg)] px-3 py-6 text-sm leading-6 text-[var(--text-muted)]">
          X 官方 API 尚未配置或暂未抓到高价值动态。配置 `X_BEARER_TOKEN` 和 `BRIEFING_X_USERS` 后会在这里显示 OpenAI、DeepMind、NVIDIA、Sam Altman 等账号的实时信号。
        </div>
      ) : (
        <div className="space-y-2.5">
          {signals.slice(0, 6).map((signal) => (
            <button
              key={signal.id}
              type="button"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                onOpenSignal(signal, { top: rect.top, left: rect.left, width: rect.width, height: rect.height, x: event.clientX, y: event.clientY });
              }}
              className="group w-full rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-3 text-left transition hover:border-[var(--hairline-strong)] hover:bg-[var(--material-muted)]"
            >
              <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                <span className="truncate">@{signal.username}</span>
                <span>{timeAgo(signal.publishedAt)}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-medium leading-5 text-[var(--text-primary)] group-hover:text-[var(--primary)]">
                {signal.title}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-[var(--radius-pill)] bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] text-[var(--primary)]">
                  {signal.impactLabel}
                </span>
                {signal.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="rounded-[var(--radius-pill)] border border-[var(--hairline)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
