import { motion } from "framer-motion";
import { ChevronRight, Globe2, Landmark, Sparkles, TrendingUp } from "lucide-react";
import { listItemFloat } from "@/lib/animations";
import type { BriefingEventClusterDTO } from "@/lib/briefing/types";

type DetailAnchor = { top: number; left: number; width: number; height: number; x?: number; y?: number };

interface Props {
  events: BriefingEventClusterDTO[];
  onOpenEvent: (event: BriefingEventClusterDTO, anchor: DetailAnchor) => void;
}

const iconByScope = {
  domestic: Landmark,
  international: Globe2,
  ai_tech: Sparkles,
  market: TrendingUp,
};

function timeLabel(input: string) {
  const delta = Date.now() - new Date(input).getTime();
  const minutes = Math.max(1, Math.floor(delta / 60_000));
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

function scoreTone(score: number) {
  if (score >= 88) return "bg-[var(--danger-soft)] text-[var(--danger)]";
  if (score >= 78) return "bg-[var(--warning-soft)] text-[var(--warning)]";
  return "bg-[var(--primary-soft)] text-[var(--primary)]";
}

export function EventRadar({ events, onOpenEvent }: Props) {
  const primary = events[0] ?? null;
  const secondary = events.slice(1, 8);

  return (
    <motion.section variants={listItemFloat} className="rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-3 shadow-[var(--shadow-sm)] sm:rounded-[var(--radius-2xl)] sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">大事雷达</p>
          <h2 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">今日大事件雷达</h2>
        </div>
        <span className="rounded-[var(--radius-pill)] bg-[var(--primary-soft)] px-3 py-1 text-xs text-[var(--primary)]">
          {events.length} 件
        </span>
      </div>

      {events.length === 0 ? (
        <div className="quiet-inset flex min-h-[180px] items-center justify-center rounded-[var(--radius-xl)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
          正在等待足够清晰的大事件信号。
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-[0.92fr_1.28fr]">
          {primary ? (
            <button
              type="button"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                onOpenEvent(primary, { top: rect.top, left: rect.left, width: rect.width, height: rect.height, x: event.clientX, y: event.clientY });
              }}
              className="group min-h-[180px] rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-inset)] p-4 text-left transition hover:border-[var(--hairline-strong)] hover:bg-[var(--material-muted)] sm:min-h-[240px] sm:p-5 xl:min-h-full"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2 text-xs text-[var(--text-muted)]">
                  {(() => {
                    const Icon = iconByScope[primary.scope];
                    return <Icon size={15} className="text-[var(--primary)]" />;
                  })()}
                  <span>{primary.scopeLabel}</span>
                  <span>·</span>
                  <span>{timeLabel(primary.latestAt)}</span>
                </div>
                <span className={`rounded-[var(--radius-pill)] px-2.5 py-1 text-[11px] ${scoreTone(primary.impactScore)}`}>
                  {primary.impactLabel} {primary.impactScore}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold leading-snug text-[var(--text-primary)] group-hover:text-[var(--primary)] sm:text-xl">
                {primary.title}
              </h3>
              <p className="mt-3 font-[var(--font-reading)] text-sm leading-7 text-[var(--text-secondary)]">
                {primary.summary}
              </p>
              <div className="mt-4 hidden space-y-2 sm:block">
                {primary.facts.slice(0, 3).map((fact) => (
                  <p key={fact} className="rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 py-2 text-xs leading-5 text-[var(--text-secondary)]">
                    {fact}
                  </p>
                ))}
              </div>
              <div className="mt-4 hidden flex-wrap gap-1.5 sm:flex">
                {primary.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="rounded-[var(--radius-pill)] border border-[var(--hairline)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
                <span>{primary.sourceCount} 个来源</span>
                <ChevronRight size={16} className="transition group-hover:translate-x-0.5" />
              </div>
            </button>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {secondary.map((item) => {
              const Icon = iconByScope[item.scope];
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    onOpenEvent(item, { top: rect.top, left: rect.left, width: rect.width, height: rect.height, x: event.clientX, y: event.clientY });
                  }}
                  className="group w-full rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3.5 py-3 text-left transition hover:border-[var(--hairline-strong)] hover:bg-[var(--material-muted)]"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                    <span className="inline-flex min-w-0 items-center gap-1.5">
                      <Icon size={13} className="shrink-0 text-[var(--primary)]" />
                      <span className="truncate">{item.scopeLabel}</span>
                    </span>
                    <span>{item.impactLabel}</span>
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-[var(--text-primary)] group-hover:text-[var(--primary)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">
                    {item.summary}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                    <span>{item.sourceCount} 源 · {timeLabel(item.latestAt)}</span>
                    <ChevronRight size={14} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </motion.section>
  );
}
