"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/base/Button";
import { cardFloatIn, heroTitleReveal } from "@/lib/animations";
import type { BriefingDigestSummary } from "@/lib/briefing/types";

interface Props {
  digest: BriefingDigestSummary | null;
  onImported?: (noteId: string) => void;
}

export function BriefingHero({ digest, onImported }: Props) {
  const [saving, setSaving] = useState(false);

  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const today = new Date();
  const fallback = {
    weekday: weekdays[today.getDay()],
    dateLabel: `${today.getMonth() + 1}月${today.getDate()}日`,
    headlines: ["资讯正在收集中，稍后再来看看。"],
  };
  const data = digest ?? fallback;

  async function importDigest() {
    if (saving) return;
    setSaving(true);
    const res = await fetch("/api/briefing/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "digest" }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.ok) onImported?.(json.noteId);
  }

  return (
    <motion.section variants={cardFloatIn} initial="initial" animate="animate" className="card-premium p-5 sm:p-6 lg:p-8 overflow-hidden relative">
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <motion.h1 variants={heroTitleReveal} className="text-[1.8rem] font-semibold leading-[1.08] tracking-[-0.055em] text-[var(--text-primary)] sm:text-[2.5rem]">
            今天值得关注
          </motion.h1>
          <div className="mt-4 space-y-2">
            {data.headlines.slice(0, 3).map((line, index) => (
              <div key={index} className="flex gap-3 items-start">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-[15px] line-clamp-2">
                  {line}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Button size="lg" onClick={importDigest} disabled={saving}>
          <Sparkles size={16} className="mr-1.5" />
          {saving ? "保存中…" : "存为笔记"}
        </Button>
      </div>
    </motion.section>
  );
}
