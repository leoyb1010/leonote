"use client";

import React, { useEffect, useState } from "react";
import { Sun, Sparkles, History, ArrowRight, WalletCards } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { NoteRow } from "@/components/notes/NoteRow";
import { Button } from "@/components/base/Button";
import { formatRelativeTime } from "@/lib/date";
import { formatMoney } from "@/lib/format-money";
import { heroTitleReveal, cardFloatIn, railSlideIn, listStagger, listItemFloat, card3DHover } from "@/lib/animations";

interface ProjectPreview {
  id: string;
  name: string;
  description: string | null;
  noteCount: number;
  updatedAt: string;
}

interface MemoryFlashback {
  id: string;
  title: string;
  excerpt: string;
  updatedAt: string;
}

interface WeeklySettling {
  created: number;
  edited: number;
  reviewed: number;
  memories: number;
}

interface RecentlyViewedItem {
  id: string;
  title: string;
  excerpt: string;
  lastViewedAt: string;
}

interface WeeklyExpense {
  total: number;
  monthTotal: number;
  topCategories: Array<{
    categoryId: string | null;
    name: string;
    emoji: string;
    color: string;
    total: number;
    count: number;
  }>;
}

interface TodayPageProps {
  data: {
    counts: { total: number; favorite: number; pinned: number };
    recent: Array<{ id: string; title: string; excerpt: string; tags: string[]; updatedAt: string }>;
    tags: string[];
    projects: ProjectPreview[];
    memoryFlashback: MemoryFlashback | null;
    weeklySettling: WeeklySettling;
    recentlyViewed: RecentlyViewedItem[];
    weeklyExpense: WeeklyExpense;
  } | null;
  signedIn: boolean;
}

interface QuickCaptureNote {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  updatedAt: string;
  favorite?: boolean;
  pinned?: boolean;
}

function getGreeting(): { emoji: string; line: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return { emoji: "🌅", line: "早上好，今天先留下一点清醒。" };
  if (hour >= 11 && hour < 14) return { emoji: "☀️", line: "中午好，把正在发生的想法安放下来。" };
  if (hour >= 14 && hour < 18) return { emoji: "🌤", line: "下午好，把正在发生的想法安放下来。" };
  if (hour >= 18 && hour < 23) return { emoji: "🌙", line: "晚上好，今天留下些什么就很好。" };
  return { emoji: "✨", line: "夜深了，轻轻记下，不必整理完。" };
}

const saveMessages = [
  "已安放。",
  "这个想法已经留下。",
  "已保存，稍后可以再慢慢整理。",
];

function QuickCapture({ onCreated }: { onCreated?: (note: QuickCaptureNote) => void }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  async function submit() {
    const text = value.trim();
    if (!text || saving) return;
    setSaving(true);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: text.split("\n")[0].slice(0, 80) || "安放的想法",
        content: text,
        excerpt: text.slice(0, 120),
        tags: [],
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setValue("");
      const msg = saveMessages[Math.floor(Math.random() * saveMessages.length)];
      setToast(msg);
      setTimeout(() => setToast(""), 2600);
      if (onCreated) onCreated(data.note);
    }
  }

  return (
    <div className="relative">
      <div className="rounded-[28px] border border-[var(--hairline)] bg-[var(--material-elevated)] p-2 shadow-[var(--shadow-sm)]">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder="有什么想法，先放在这里。"
          className="min-h-[56px] w-full resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-[var(--text-placeholder)]"
          rows={1}
        />
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-xs text-[var(--text-muted)]">Enter 保存 · Shift + Enter 换行</span>
          <Button size="md" onClick={submit} loading={saving} variant="primary">
            安放
          </Button>
        </div>
      </div>
      {toast && (
        <p className="mt-2.5 text-xs text-[var(--text-muted)] text-center">{toast}</p>
      )}
    </div>
  );
}

export function TodayPage({ data, signedIn }: TodayPageProps) {
  const [recent, setRecent] = useState(data?.recent ?? []);
  const [counts, setCounts] = useState(data?.counts ?? { total: 0, favorite: 0, pinned: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard mounted pattern for hydration safety
    setMounted(true);
  }, []);

  const dateStr = mounted
    ? new Date().toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      })
    : "";

  const greeting = mounted ? getGreeting() : { emoji: "", line: "" };

  // Signed out
  if (!signedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 mb-6 rounded-2xl bg-[var(--primary-soft)] flex items-center justify-center">
          <Sun size={32} className="text-[var(--primary)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Leonote</h1>
        <p className="text-base text-[var(--text-secondary)] max-w-sm mb-8 leading-relaxed">
          把想法安放成时间里的智慧。
        </p>
        <Link href="/login">
          <Button size="lg">进入 Leonote</Button>
        </Link>
      </div>
    );
  }

  // Loading
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-sm text-[var(--text-muted)]">正在轻轻打开你的知识库…</p>
        <div className="w-4 h-4 rounded-full border-2 border-[var(--text-muted)]/20 border-t-[var(--text-muted)]/60 animate-spin" />
      </div>
    );
  }

  const { tags, projects, memoryFlashback, weeklySettling, weeklyExpense, recentlyViewed } = data;

  const handleNoteCreated = (note: QuickCaptureNote) => {
    setRecent((prev) => [note, ...prev].slice(0, 5));
    setCounts((prev) => ({ ...prev, total: prev.total + 1 }));
  };

  const showRightRail = memoryFlashback || weeklySettling.created > 0 || weeklyExpense.total > 0 || recentlyViewed.length > 0;

  const heroSection = (
    <motion.section
      className="leonote-hero pb-6 border-b border-[var(--hairline)]"
      variants={heroTitleReveal}
      initial="initial"
      animate="animate"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[var(--text-muted)] tracking-wide">{dateStr}</p>
          <h1 className="mt-2 text-[1.375rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            {greeting.line}
          </h1>
          {counts.total > 0 && (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              你已经安放了 {counts.total} 篇笔记。最近的思考，正在慢慢形成脉络。
            </p>
          )}
        </div>
        <Link href="/notes/new" className="shrink-0">
          <Button size="lg">开始书写</Button>
        </Link>
      </div>
    </motion.section>
  );

  const mainContent = (
    <div className="space-y-8">
      {heroSection}

      {/* QuickCapture */}
      <QuickCapture onCreated={handleNoteCreated} />

      {/* Recent Notes */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">最近编辑</h2>
            <Link
              href="/notes"
              className="text-xs text-[var(--primary)] hover:underline inline-flex items-center gap-1"
            >
              查看全部 <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-[var(--hairline)] rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-1">
            {recent.slice(0, 5).map((note) => (
              <NoteRow key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">进行中的项目</h2>
            <Link
              href="/projects"
              className="text-xs text-[var(--primary)] hover:underline inline-flex items-center gap-1"
            >
              查看全部 <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-[var(--hairline)] rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-1">
            {projects.slice(0, 4).map((proj) => (
              <Link
                key={proj.id}
                href={`/projects/${proj.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-[var(--interactive-hover)] rounded-lg"
              >
                <span className="truncate text-sm text-[var(--text-primary)]">{proj.name}</span>
                <span className="text-xs text-[var(--text-muted)] shrink-0">{proj.noteCount} 篇</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">常用标签</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="text-xs px-2.5 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] transition-colors hover:bg-[var(--primary-pressed)]"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  const rightRail = showRightRail ? (
    <motion.aside className="space-y-4" variants={railSlideIn} initial="initial" animate="animate">
      {/* Weekly Settling */}
      {weeklySettling.created > 0 && (
        <motion.div className="rounded-2xl border border-[var(--hairline)] bg-[var(--material-inset)] px-4 py-4" variants={cardFloatIn} whileHover={card3DHover.whileHover} whileTap={card3DHover.whileTap}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-[var(--text-muted)]" />
            <span className="text-xs font-medium text-[var(--text-muted)]">本周沉淀</span>
          </div>
          <div className="space-y-1.5 text-sm text-[var(--text-secondary)]">
            <p>新增 {weeklySettling.created} 篇笔记</p>
            <p>编辑 {weeklySettling.edited} 次</p>
            {weeklySettling.reviewed > 0 && <p>回看 {weeklySettling.reviewed} 篇旧笔记</p>}
            {weeklySettling.memories > 0 && <p>形成 {weeklySettling.memories} 条长期记忆</p>}
          </div>
        </motion.div>
      )}

      {/* v1.5 Weekly Expense */}
      {weeklyExpense.total > 0 && (
        <motion.div className="rounded-2xl border border-[var(--hairline)] bg-[var(--material-inset)] px-4 py-4" variants={cardFloatIn} whileHover={card3DHover.whileHover} whileTap={card3DHover.whileTap}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <WalletCards size={16} className="text-[var(--text-muted)]" />
              <span className="text-xs font-medium text-[var(--text-muted)]">本周开销</span>
            </div>
            <Link href="/ledger" className="text-xs text-[var(--primary)] hover:underline">
              看一眼
            </Link>
          </div>
          <p className="text-sm text-[var(--text-secondary)] [font-variant-numeric:tabular-nums]">
            这周记下 {formatMoney(weeklyExpense.total)}
          </p>
          {weeklyExpense.topCategories.length > 0 ? (
            <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
              主要花在 {weeklyExpense.topCategories.map((item) => `${item.emoji} ${item.name}`).join("、")}。
            </p>
          ) : null}
        </motion.div>
      )}

      {/* Memory Flashback */}
      {memoryFlashback && (
        <motion.div className="rounded-2xl border border-[var(--hairline)] bg-[var(--material-inset)] px-4 py-4" variants={cardFloatIn} whileHover={card3DHover.whileHover} whileTap={card3DHover.whileTap}>
          <div className="flex items-center gap-2 mb-3">
            <History size={16} className="text-[var(--text-muted)]" />
            <span className="text-xs font-medium text-[var(--text-muted)]">记忆闪回</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-2">
            你在 {formatRelativeTime(memoryFlashback.updatedAt)}前写过：
          </p>
          <Link
            href={`/notes/${memoryFlashback.id}`}
            className="block text-sm text-[var(--text-primary)] leading-relaxed hover:text-[var(--primary)] transition-colors"
          >
            &ldquo;{memoryFlashback.excerpt || memoryFlashback.title}&rdquo;
          </Link>
          <p className="mt-2 text-xs text-[var(--text-muted)]">也许今天可以重新看一眼。</p>
        </motion.div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <motion.div className="rounded-2xl border border-[var(--hairline)] bg-[var(--material-inset)] px-4 py-4" variants={cardFloatIn} whileHover={card3DHover.whileHover} whileTap={card3DHover.whileTap}>
          <span className="text-xs font-medium text-[var(--text-muted)]">最近回看</span>
          <div className="mt-3 space-y-2">
            {recentlyViewed.map((item) => (
              <Link
                key={item.id}
                href={`/notes/${item.id}`}
                className="block text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors truncate"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.aside>
  ) : null;

  // Empty state
  if (counts.total === 0) {
    return (
      <div className="space-y-8">
        {heroSection}
        <QuickCapture onCreated={handleNoteCreated} />
        <div className="text-center py-12">
          <p className="text-sm text-[var(--text-muted)]">
            这里还很安静。写下第一条想法，它会成为你的起点。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 2xl:grid-cols-[minmax(0,1fr)_320px]">
      <main>{mainContent}</main>
      {rightRail}
    </div>
  );
}
