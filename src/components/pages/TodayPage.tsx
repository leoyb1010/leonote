"use client";

import React, { useEffect, useState } from "react";
import { BookOpenText, Boxes, FilePlus2, FolderPlus, Gauge, History, Library, Newspaper, PenLine, Search, Sparkles, Sun, WalletCards } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { NoteRow } from "@/components/notes/NoteRow";
import { Button, buttonClass } from "@/components/base/Button";
import { formatRelativeTime } from "@/lib/date";
import { formatMoney } from "@/lib/format-money";
import { heroTitleReveal, cardFloatIn, railSlideIn, card3DHover } from "@/lib/animations";

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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "早上好，今天先留下一点清醒。";
  if (hour >= 11 && hour < 14) return "中午好，把正在发生的想法安放下来。";
  if (hour >= 14 && hour < 18) return "下午好，把正在发生的想法安放下来。";
  if (hour >= 18 && hour < 23) return "晚上好，今天留下些什么就很好。";
  return "夜深了，轻轻记下，不必整理完。";
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
      <div className="rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-2 shadow-[var(--shadow-sm)]">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && event.shiftKey) {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder="有什么想法，先放在这里。"
          className="min-h-[56px] w-full resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-[var(--text-placeholder)]"
          rows={1}
        />
        <div className="flex flex-col items-stretch gap-2 px-2 pb-1 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-[var(--text-muted)]">Enter 换行 · Shift + Enter 保存</span>
          <Button size="md" icon={<PenLine size={15} />} onClick={submit} loading={saving} variant="primary" className="w-full sm:w-auto">
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

function DashboardMetric({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="quiet-inset min-w-0 rounded-[var(--radius-xl)] p-4">
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--material-elevated)] text-[var(--text-secondary)]">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)] numeric-display">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{hint}</p>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--material-inset)] text-[var(--text-muted)]">
          {icon}
        </span>
        <h2 className="truncate text-sm font-medium text-[var(--text-secondary)]">{title}</h2>
      </div>
      {href ? (
        <Link href={href} className="inline-flex h-8 shrink-0 items-center rounded-lg px-2 text-xs text-[var(--primary)] hover:bg-[var(--interactive-hover)]">
          查看
        </Link>
      ) : null}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="quiet-inset group flex min-h-[72px] min-w-0 items-center gap-3 rounded-[var(--radius-xl)] p-3 transition hover:border-[var(--hairline-strong)] hover:bg-[var(--material-muted)]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--material-elevated)] text-[var(--primary)]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-[var(--text-primary)]">{label}</span>
        <span className="mt-1 block truncate text-xs text-[var(--text-muted)]">{hint}</span>
      </span>
    </Link>
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

  const greeting = mounted ? getGreeting() : "";

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
        <Button size="lg" asChild>
          <Link href="/login">进入 Leonote</Link>
        </Button>
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

  const renderRailCards = () => (
    <>
      {/* Weekly Settling */}
      {weeklySettling.created > 0 && (
        <motion.div className="min-w-0 rounded-2xl border border-[var(--hairline)] bg-[var(--material-inset)] px-4 py-4" variants={cardFloatIn} whileHover={card3DHover.whileHover} whileTap={card3DHover.whileTap}>
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
        <motion.div className="min-w-0 rounded-2xl border border-[var(--hairline)] bg-[var(--material-inset)] px-4 py-4" variants={cardFloatIn} whileHover={card3DHover.whileHover} whileTap={card3DHover.whileTap}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <WalletCards size={16} className="shrink-0 text-[var(--text-muted)]" />
              <span className="truncate text-xs font-medium text-[var(--text-muted)]">本周开销</span>
            </div>
            <Link href="/ledger" className="shrink-0 text-xs text-[var(--primary)] hover:underline">
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
        <motion.div className="min-w-0 rounded-2xl border border-[var(--hairline)] bg-[var(--material-inset)] px-4 py-4" variants={cardFloatIn} whileHover={card3DHover.whileHover} whileTap={card3DHover.whileTap}>
          <div className="flex items-center gap-2 mb-3">
            <History size={16} className="text-[var(--text-muted)]" />
            <span className="text-xs font-medium text-[var(--text-muted)]">记忆闪回</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-2">
            你在 {formatRelativeTime(memoryFlashback.updatedAt)}前写过：
          </p>
          <Link
            href={`/notes/${memoryFlashback.id}`}
            className="block break-words text-sm text-[var(--text-primary)] leading-relaxed hover:text-[var(--primary)] transition-colors"
          >
            &ldquo;{memoryFlashback.excerpt || memoryFlashback.title}&rdquo;
          </Link>
          <p className="mt-2 text-xs text-[var(--text-muted)]">也许今天可以重新看一眼。</p>
        </motion.div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <motion.div className="min-w-0 rounded-2xl border border-[var(--hairline)] bg-[var(--material-inset)] px-4 py-4" variants={cardFloatIn} whileHover={card3DHover.whileHover} whileTap={card3DHover.whileTap}>
          <span className="text-xs font-medium text-[var(--text-muted)]">最近回看</span>
          <div className="mt-3 space-y-2">
            {recentlyViewed.map((item) => (
              <Link
                key={item.id}
                href={`/notes/${item.id}`}
                className="block truncate text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </>
  );

  const heroSection = (
    <motion.section
      className="leonote-hero relative z-20 rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-4 shadow-[var(--shadow-sm)] sm:p-5"
      variants={heroTitleReveal}
      initial="initial"
      animate="animate"
    >
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--material-inset)] text-[var(--text-secondary)]">
              <Gauge size={15} />
            </span>
            <span>{dateStr}</span>
          </div>
          <h1 className="mt-4 text-xl font-semibold leading-snug text-[var(--text-primary)] sm:text-2xl">
            {greeting}
          </h1>
          {counts.total > 0 && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              你已经安放了 {counts.total} 篇笔记。最近的思考，正在慢慢形成脉络。
            </p>
          )}
        </div>
        <details className="relative w-full shrink-0 open:z-[80] sm:w-auto">
          <summary
            data-testid="today-start-writing"
            className={buttonClass("primary", "lg", "w-full list-none sm:w-auto [&::-webkit-details-marker]:hidden")}
          >
            开始书写
          </summary>
          <div
            data-testid="today-create-menu"
            className="absolute right-0 top-[calc(100%+0.5rem)] z-[70] w-full min-w-[260px] rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-2 shadow-[var(--shadow-md)] sm:w-[320px]"
          >
            <p className="px-3 py-2 text-sm font-medium text-[var(--text-primary)]">选择要写什么</p>
            {/* Native anchors keep this menu usable even if client routing has not hydrated yet. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/notes/new"
              className="flex min-h-[56px] items-center gap-3 rounded-2xl px-4 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--interactive-hover)] hover:text-[var(--text-primary)]"
            >
              <FilePlus2 size={18} className="shrink-0 text-[var(--primary)]" />
              <span>
                <span className="block font-medium text-[var(--text-primary)]">新笔记</span>
                <span className="mt-0.5 block text-xs text-[var(--text-muted)]">打开完整编辑器</span>
              </span>
            </a>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/ledger"
              className="flex min-h-[56px] items-center gap-3 rounded-2xl px-4 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--interactive-hover)] hover:text-[var(--text-primary)]"
            >
              <WalletCards size={18} className="shrink-0 text-[var(--primary)]" />
              <span>
                <span className="block font-medium text-[var(--text-primary)]">记一笔</span>
                <span className="mt-0.5 block text-xs text-[var(--text-muted)]">记录今天的花费</span>
              </span>
            </a>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/projects"
              className="flex min-h-[56px] items-center gap-3 rounded-2xl px-4 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--interactive-hover)] hover:text-[var(--text-primary)]"
            >
              <FolderPlus size={18} className="shrink-0 text-[var(--primary)]" />
              <span>
                <span className="block font-medium text-[var(--text-primary)]">项目笔记</span>
                <span className="mt-0.5 block text-xs text-[var(--text-muted)]">进入项目空间继续写</span>
              </span>
            </a>
          </div>
        </details>
      </div>
    </motion.section>
  );

  const mainContent = (
    <div className="min-w-0 space-y-6">
      {heroSection}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric label="全部笔记" value={String(counts.total)} hint={`${counts.pinned} 篇置顶`} icon={<Library size={15} />} />
        <DashboardMetric label="收藏内容" value={String(counts.favorite)} hint="长期值得回看" icon={<BookOpenText size={15} />} />
        <DashboardMetric label="本周新增" value={String(weeklySettling.created)} hint={`${weeklySettling.edited} 次编辑`} icon={<Sparkles size={15} />} />
        <DashboardMetric label="本周开销" value={formatMoney(weeklyExpense.total)} hint="装备与日常都可追踪" icon={<WalletCards size={15} />} />
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <QuickLink href="/briefing" icon={<Newspaper size={17} />} label="每日简报" hint="雷达、精选、思考" />
        <QuickLink href="/notes" icon={<Search size={17} />} label="笔记库" hint="搜索和对象管理" />
        <QuickLink href="/ledger" icon={<Boxes size={17} />} label="装备库" hint="设备、价格、保修" />
        <QuickLink href="/projects" icon={<FolderPlus size={17} />} label="项目" hint="按主题整理" />
      </section>

      <QuickCapture onCreated={handleNoteCreated} />

      {recent.length > 0 && (
        <section>
          <SectionTitle icon={<Library size={15} />} title="最近编辑" href="/notes" />
          <div className="min-w-0 divide-y divide-[var(--hairline)] rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-1">
            {recent.slice(0, 5).map((note) => (
              <NoteRow key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section>
          <SectionTitle icon={<FolderPlus size={15} />} title="进行中的项目" href="/projects" />
          <div className="min-w-0 divide-y divide-[var(--hairline)] rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-1">
            {projects.slice(0, 4).map((proj) => (
              <Link
                key={proj.id}
                href={`/projects/${proj.id}`}
                className="flex min-w-0 items-center justify-between gap-4 rounded-lg px-4 py-3 transition-colors hover:bg-[var(--interactive-hover)]"
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
          <SectionTitle icon={<Search size={15} />} title="常用标签" />
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

  const desktopRightRail = showRightRail ? (
    <motion.aside className="hidden min-w-0 space-y-4 2xl:block" variants={railSlideIn} initial="initial" animate="animate">
      {renderRailCards()}
    </motion.aside>
  ) : null;

  const mobileRail = showRightRail ? (
    <aside className="min-w-0 space-y-4 2xl:hidden">{renderRailCards()}</aside>
  ) : null;

  // Empty state
  if (counts.total === 0) {
    return (
      <div className="min-w-0 space-y-8">
        {heroSection}
        <QuickCapture onCreated={handleNoteCreated} />
        {mobileRail}
        <div className="text-center py-12">
          <p className="text-sm text-[var(--text-muted)]">
            这里还很安静。写下第一条想法，它会成为你的起点。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-8 2xl:grid-cols-[minmax(0,1fr)_320px]">
      <main className="min-w-0 space-y-8">
        {mainContent}
        {mobileRail}
      </main>
      {desktopRightRail}
    </div>
  );
}
