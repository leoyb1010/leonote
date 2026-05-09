"use client";

import { motion } from "framer-motion";
import { cardFloatIn, heroTitleReveal } from "@/lib/animations";
import type { BriefingDigestSummary } from "@/lib/briefing/types";

interface Props {
  digest: BriefingDigestSummary | null;
  total: number;
  range: "today" | "week" | "favorites";
}

export function BriefingHero({ digest, total, range }: Props) {
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const today = new Date();
  const fallback = {
    weekday: weekdays[today.getDay()],
    dateLabel: `${today.getMonth() + 1}月${today.getDate()}日`,
    headlines: ["资讯正在收集中，稍后再来看看。"],
  };
  const data = digest ?? fallback;
  const rangeLabel = range === "today" ? "今日" : range === "week" ? "本周" : "收藏";
  const headlines = data.headlines;

  return (
    <motion.section variants={cardFloatIn} initial="initial" animate="animate" className="card-premium relative overflow-hidden p-5 sm:p-6 lg:p-8">
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_220px] lg:items-end">
        <div className="max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>{data.weekday}</span>
            <span className="h-1 w-1 rounded-full bg-[var(--text-faint)]" />
            <span>{data.dateLabel}</span>
          </div>
          <motion.h1 variants={heroTitleReveal} className="text-[1.8rem] font-semibold leading-[1.08] text-[var(--text-primary)] sm:text-[2.45rem]">
            今日简报
          </motion.h1>
          <div className="mt-4 space-y-2">
            {(headlines.length > 0 ? headlines : fallback.headlines).map((line, index) => (
              <div key={index} className="flex gap-3 items-start">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-[15px]">
                  {line}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <div className="quiet-inset rounded-[var(--radius-lg)] px-4 py-3">
            <p className="text-xs text-[var(--text-muted)]">{rangeLabel}资讯</p>
            <p className="numeric-display mt-1 text-2xl font-semibold text-[var(--text-primary)]">{total}</p>
          </div>
          <div className="quiet-inset rounded-[var(--radius-lg)] px-4 py-3">
            <p className="text-xs text-[var(--text-muted)]">更新节奏</p>
            <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">滚动跟进</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
