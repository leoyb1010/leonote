"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { BrainCircuit, CalendarDays, Check, CloudSun, Copy, FilePlus2, Gauge, Loader2, Newspaper, RefreshCw, Tags } from "lucide-react";
import { Button } from "@/components/base/Button";
import { cardFloatIn, heroTitleReveal } from "@/lib/animations";
import type { BriefingDigestSummary, BriefingRange, BriefingThinkingInsight, WeatherDTO } from "@/lib/briefing/types";

export interface BriefingHeroStats {
  total: number;
  unread: number;
  averageScore: number | null;
  topTags: string[];
}

interface Props {
  digest: BriefingDigestSummary | null;
  stats: BriefingHeroStats;
  thinkingInsights: BriefingThinkingInsight[];
  weather: WeatherDTO | null;
  dateLabel: string;
  range: BriefingRange;
  title: string;
  loading?: boolean;
  importingDigest?: boolean;
  copied?: boolean;
  onRefresh: () => void;
  onImportDigest: () => void;
  onCopySummary: () => void;
  onTitleChange: (title: string) => void;
}

function ThinkingInsightCard({ insight, index }: { insight: BriefingThinkingInsight; index: number }) {
  return (
    <article className="quiet-inset rounded-[var(--radius-lg)] p-3.5 transition-colors hover:bg-[var(--material-muted)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--primary-soft)] px-2 py-0.5 text-[var(--primary)]">
              <BrainCircuit size={11} />
              推理 {index + 1}
            </span>
            <span>{insight.impactLabel}</span>
            <span className="numeric-display">置信 {insight.confidence}</span>
          </div>
          <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)]">
            {insight.title}
          </h3>
        </div>
      </div>
      <p className="mt-2 font-[var(--font-reading)] text-sm leading-6 text-[var(--text-secondary)]">
        {insight.whyItMatters}
      </p>
      <p className="mt-2 font-[var(--font-reading)] text-xs leading-5 text-[var(--text-muted)]">
        {insight.thesis}
      </p>
      <p className="mt-2 rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 py-2 font-[var(--font-reading)] text-xs leading-5 text-[var(--text-secondary)]">
        {insight.question}
      </p>
      {insight.sourceTitles.length > 0 ? (
        <div className="mt-3 space-y-1.5 border-t border-[var(--hairline)] pt-3">
          {insight.sourceTitles.slice(0, 2).map((title) => (
            <p key={title} className="line-clamp-1 text-[11px] leading-5 text-[var(--text-muted)]">
              依据：{title}
            </p>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {insight.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-[var(--radius-pill)] border border-[var(--hairline)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]">
            {tag}
          </span>
        ))}
      </div>
      {insight.habitSignals.length > 0 ? (
        <p className="mt-2 text-[11px] leading-5 text-[var(--text-muted)]">
          结合你的思考线索：{insight.habitSignals.join(" / ")}
        </p>
      ) : null}
    </article>
  );
}

function rangeLabel(range: BriefingRange) {
  if (range === "week") return "最近 7 天";
  if (range === "favorites") return "收藏简报";
  return "今日简报";
}

function qualityLabel(score: number | null) {
  if (score == null) return "等待评分";
  if (score >= 80) return "高质量";
  if (score >= 60) return "可读";
  return "待筛选";
}

function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: React.ReactNode;
  hint: string;
}) {
  return (
    <div className="quiet-inset rounded-[var(--radius-lg)] px-3.5 py-3">
      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
        <span className="text-[var(--text-faint)]">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-[1.35rem] font-semibold leading-none text-[var(--text-primary)]">
        {value}
      </div>
      <p className="mt-1.5 text-[11px] leading-4 text-[var(--text-muted)]">{hint}</p>
    </div>
  );
}

export function BriefingHero({
  stats,
  thinkingInsights,
  weather,
  dateLabel,
  range,
  title,
  loading = false,
  importingDigest = false,
  copied = false,
  onRefresh,
  onImportDigest,
  onCopySummary,
  onTitleChange,
}: Props) {
  const score = stats.averageScore == null ? null : Math.round(stats.averageScore);

  return (
    <motion.section
      variants={cardFloatIn}
      initial="initial"
      animate="animate"
      className="card-premium relative overflow-hidden p-5 sm:p-6 lg:p-7"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.055),transparent_32%),radial-gradient(circle_at_92%_18%,var(--primary-soft),transparent_34%)]" />

      <div className="relative z-10 grid gap-7 xl:grid-cols-[minmax(0,1fr)_430px] xl:items-end">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2.5 py-1">
              <CalendarDays size={13} />
              {dateLabel}
            </span>
            <span className="rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2.5 py-1">
              {rangeLabel(range)}
            </span>
            {weather ? (
              <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2.5 py-1">
                <CloudSun size={13} />
                深圳 {Math.round(weather.temp)}° · {weather.weatherLabel} · 湿度 {weather.humidity}%
              </span>
            ) : null}
          </div>

          <motion.div
            variants={heroTitleReveal}
          >
            <input
              aria-label="简报标题"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              className="w-full max-w-3xl bg-transparent text-[1.7rem] font-semibold leading-tight text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-placeholder)] focus:text-[var(--primary)] sm:text-[2.15rem]"
              placeholder="每日简报"
            />
          </motion.div>

          <div className="mt-5 max-w-4xl">
            <div className="mb-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <BrainCircuit size={14} className="text-[var(--primary)]" />
              AI 协助思考 · 从深度影响和分析价值里筛选
            </div>
            {thinkingInsights.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-2">
                {thinkingInsights.slice(0, 5).map((insight, index) => (
                  <ThinkingInsightCard key={insight.id} insight={insight} index={index} />
                ))}
              </div>
            ) : (
              <div className="quiet-inset rounded-[var(--radius-lg)] px-4 py-5 text-sm leading-6 text-[var(--text-muted)]">
                资讯正在收集中。等有足够高价值事件后，我会把它们整理成 3-5 条可推演的思考线索。
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={onRefresh} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              刷新简报
            </Button>
            <Button variant="secondary" size="sm" onClick={onImportDigest} disabled={importingDigest || stats.total === 0} className="gap-1.5">
              {importingDigest ? <Loader2 size={14} className="animate-spin" /> : <FilePlus2 size={14} />}
              存为笔记
            </Button>
            <Button variant="ghost" size="sm" onClick={onCopySummary} disabled={stats.total === 0} className="gap-1.5">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "已复制" : "复制摘要"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            icon={<Newspaper size={13} />}
            label="资讯"
            value={<span className="numeric-display">{stats.total}</span>}
            hint={`${stats.unread} 条未读`}
          />
          <MetricCard
            icon={<Gauge size={13} />}
            label="质量"
            value={<span className="numeric-display">{score == null ? "..." : `${score}`}</span>}
            hint={qualityLabel(score)}
          />
          <div className="quiet-inset col-span-2 rounded-[var(--radius-lg)] px-3.5 py-3">
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <Tags size={13} />
              重要标签
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(stats.topTags.length ? stats.topTags : ["等待标签"]).slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-elevated)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
