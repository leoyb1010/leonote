"use client";

import { motion } from "framer-motion";
import { useMemo, useState, type ReactNode } from "react";
import { BrainCircuit, CalendarDays, Check, ChevronRight, CloudSun, Copy, FilePlus2, Gauge, Loader2, MoonStar, Newspaper, RefreshCw, Sparkles, Tags, X } from "lucide-react";
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

type HoroscopeProfile = {
  role: string;
  sign: string;
  tone: string;
};

const HOROSCOPE_PROFILES: HoroscopeProfile[] = [
  { role: "我", sign: "天秤座", tone: "判断更准，适合做取舍" },
  { role: "老婆", sign: "双鱼座", tone: "感受力在线，适合慢沟通" },
  { role: "女儿", sign: "双子座", tone: "好奇心旺，适合新鲜输入" },
];

const HOROSCOPE_WORDS = [
  "稳",
  "清",
  "顺",
  "亮",
  "缓",
  "准",
  "新",
];

function dailyIndex(seed: string, offset: number, mod: number) {
  let total = offset * 17;
  for (let index = 0; index < seed.length; index += 1) {
    total += seed.charCodeAt(index) * (index + 3);
  }
  return Math.abs(total) % mod;
}

function buildHoroscopes(seed: string) {
  return HOROSCOPE_PROFILES.map((profile, index) => ({
    ...profile,
    word: HOROSCOPE_WORDS[dailyIndex(seed, index, HOROSCOPE_WORDS.length)],
    score: 76 + dailyIndex(seed, index + 5, 18),
  }));
}

function ThinkingInsightBubble({
  insight,
  onClose,
}: {
  insight: BriefingThinkingInsight | null;
  onClose: () => void;
}) {
  if (!insight) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[70]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[var(--overlay-scrim)] backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-0"
        aria-label="关闭思考线索详情"
        onClick={onClose}
      />
      <motion.article
        className="card-premium fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] max-h-[78dvh] overflow-hidden rounded-[var(--radius-2xl)] sm:inset-x-auto sm:bottom-auto sm:right-5 sm:top-20 sm:w-[430px]"
        initial={{ opacity: 0, y: 18, x: 0, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, x: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--hairline)] bg-[var(--material-elevated)] px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:pt-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--primary-soft)] px-2 py-0.5 text-[var(--primary)]">
                <BrainCircuit size={11} />
                AI 协助思考
              </span>
              <span>{insight.impactLabel}</span>
              <span className="numeric-display">置信 {insight.confidence}</span>
            </div>
            <h3 className="mt-2 text-base font-semibold leading-snug text-[var(--text-primary)]">
              {insight.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--hairline)] text-[var(--text-muted)] transition hover:bg-[var(--interactive-hover)] hover:text-[var(--text-primary)]"
            aria-label="关闭"
          >
            <X size={16} />
          </button>
        </header>

        <div className="max-h-[calc(78dvh-5rem)] overflow-y-auto px-4 py-4">
          <p className="font-[var(--font-reading)] text-sm leading-7 text-[var(--text-secondary)]">
            {insight.whyItMatters}
          </p>
          <p className="mt-3 font-[var(--font-reading)] text-sm leading-7 text-[var(--text-secondary)]">
            {insight.thesis}
          </p>
          <div className="mt-4 rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3.5 py-3">
            <p className="mb-1.5 text-xs text-[var(--primary)]">今天可以追问</p>
            <p className="font-[var(--font-reading)] text-sm leading-7 text-[var(--text-secondary)]">
              {insight.question}
            </p>
          </div>
          {insight.sourceTitles.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-xs text-[var(--text-muted)]">依据来源</p>
              <div className="space-y-2">
                {insight.sourceTitles.map((title) => (
                  <p key={title} className="rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 py-2 text-xs leading-5 text-[var(--text-secondary)]">
                    {title}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {insight.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="rounded-[var(--radius-pill)] border border-[var(--hairline)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
                {tag}
              </span>
            ))}
          </div>
          {insight.habitSignals.length > 0 ? (
            <p className="mt-3 text-xs leading-6 text-[var(--text-muted)]">
              结合你的思考线索：{insight.habitSignals.join(" / ")}
            </p>
          ) : null}
        </div>
      </motion.article>
    </motion.div>
  );
}

function ThinkingInsightStrip({
  insights,
  onSelect,
}: {
  insights: BriefingThinkingInsight[];
  onSelect: (insight: BriefingThinkingInsight) => void;
}) {
  return (
    <section className="quiet-inset rounded-[var(--radius-xl)] p-3.5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-xs text-[var(--text-muted)]">
          <BrainCircuit size={14} className="text-[var(--primary)]" />
          <span className="truncate">AI 协助思考 · 深度影响优先</span>
        </div>
        <span className="numeric-display shrink-0 rounded-[var(--radius-pill)] bg-[var(--primary-soft)] px-2 py-0.5 text-[11px] text-[var(--primary)]">
          {insights.length || 0} 条
        </span>
      </div>

      {insights.length > 0 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {insights.slice(0, 5).map((insight, index) => (
            <button
              key={insight.id}
              type="button"
              onClick={() => onSelect(insight)}
              className="group min-w-[230px] rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-3 text-left transition hover:-translate-y-0.5 hover:bg-[var(--material-muted)] md:min-w-0"
            >
              <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1">
                  <Sparkles size={11} className="text-[var(--primary)]" />
                  线索 {index + 1}
                </span>
                <span>{insight.impactLabel}</span>
              </div>
              <p className="mt-2 line-clamp-2 min-h-9 text-sm font-medium leading-snug text-[var(--text-primary)]">
                {insight.title}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                <span className="numeric-display">置信 {insight.confidence}</span>
                <ChevronRight size={13} className="transition group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          disabled
          className="w-full rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-elevated)] px-3 py-4 text-left text-sm leading-6 text-[var(--text-muted)]"
        >
          资讯正在收集中。等有足够高价值事件后，我会整理成 3-5 条可推演线索。
        </button>
      )}
    </section>
  );
}

function HoroscopeStrip({ seed }: { seed: string }) {
  const horoscopes = useMemo(() => buildHoroscopes(seed), [seed]);
  return (
    <div className="quiet-inset rounded-[var(--radius-lg)] px-3.5 py-3">
      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
        <MoonStar size={13} />
        今日星座
      </div>
      <div className="mt-3 grid gap-2">
        {horoscopes.map((item) => (
          <div key={item.role} className="flex items-center justify-between gap-3 text-xs">
            <span className="min-w-0 truncate text-[var(--text-secondary)]">
              {item.role} · {item.sign}
            </span>
            <span className="shrink-0 rounded-[var(--radius-pill)] bg-[var(--material-elevated)] px-2 py-0.5 text-[var(--text-muted)]">
              {item.word} · {item.score}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-5 text-[var(--text-muted)]">
        {horoscopes.map((item) => `${item.role}${item.tone}`).join("；")}
      </p>
    </div>
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
  value: ReactNode;
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
  const [selectedInsight, setSelectedInsight] = useState<BriefingThinkingInsight | null>(null);
  const horoscopeBrief = useMemo(() => buildHoroscopes(dateLabel).map((item) => `${item.role}${item.word}`).join(" · "), [dateLabel]);

  return (
    <motion.section
      variants={cardFloatIn}
      initial="initial"
      animate="animate"
      className="card-premium relative overflow-hidden p-5 sm:p-6 lg:p-7"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.055),transparent_32%),radial-gradient(circle_at_92%_18%,var(--primary-soft),transparent_34%)]" />

      <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
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
            <span className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2.5 py-1">
              <MoonStar size={13} />
              今日星座 · {horoscopeBrief}
            </span>
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
            <ThinkingInsightStrip insights={thinkingInsights} onSelect={setSelectedInsight} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
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

        <div className="grid grid-cols-2 gap-3 xl:pt-1">
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
          <div className="col-span-2">
            <HoroscopeStrip seed={dateLabel} />
          </div>
        </div>
      </div>

      <ThinkingInsightBubble insight={selectedInsight} onClose={() => setSelectedInsight(null)} />
    </motion.section>
  );
}
