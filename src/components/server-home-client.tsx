"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, BrainCircuit, FolderKanban, Sparkles } from "lucide-react";
import { NoteCard } from "@/components/notes/NoteCard";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { staggerContainer, staggerItem } from "@/lib/animations";

const quickActions = [
  { label: "继续记录", href: "/notes/new" },
  { label: "搜索", href: "/search" },
  { label: "记忆", href: "/favorites" },
  { label: "每日", href: "/daily" },
];

type HomeViewData = {
  recent: Array<{ id: string; title: string; excerpt: string; tags: string[]; updatedAt: string; favorite?: boolean; pinned?: boolean }>;
  tags: string[];
  counts: { favorite: number; pinned: number; total: number };
  projects: Array<{ id: string; name: string; description: string; noteCount: number; updatedAt: string }>;
};

export function ServerHomeClient({ data, signedIn }: { data: HomeViewData | null; signedIn: boolean }) {
  if (!signedIn) {
    return <GlassPanel blur="lg" className="rounded-[var(--radius-lg)] p-5 text-sm leading-7 text-[var(--text-secondary)]">当前未登录。先去 <Link href="/login" className="font-medium text-[var(--text-primary)] underline underline-offset-4">登录</Link>，再进入你的工作台。</GlassPanel>;
  }

  if (!data) {
    return <GlassPanel blur="lg" className="rounded-[var(--radius-lg)] p-5 text-sm leading-7 text-[var(--text-secondary)]">正在准备工作台…</GlassPanel>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <GlassPanel blur="xl" className="rounded-[var(--radius-lg)] p-5 md:p-6">
          <div className="text-[11px] font-semibold text-[var(--text-muted)]">Today</div>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] md:text-[32px]">让 AI 真正记住你，但永远不喧宾夺主。</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">Leonote 现在把笔记、项目和长期记忆沉淀在一个更安静的深色工作流里。写作、检索、整理，都更有呼吸感。</p>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {quickActions.map((item) => (
              <Link key={item.label} href={item.href} className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-3 py-4 text-center text-sm text-[var(--text-secondary)] transition hover:-translate-y-[1px] hover:bg-[rgba(255,255,255,0.10)] hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </GlassPanel>

        <div className="grid grid-cols-3 gap-3 xl:grid-cols-1">
          <GlassPanel blur="lg" className="rounded-[var(--radius-lg)] p-4 text-center"><div className="text-3xl font-semibold text-[var(--text-primary)]">{data.counts.total}</div><div className="mt-1 text-xs text-[var(--text-muted)]">最近活跃</div></GlassPanel>
          <GlassPanel blur="lg" className="rounded-[var(--radius-lg)] p-4 text-center"><div className="text-3xl font-semibold text-[var(--text-primary)]">{data.counts.favorite}</div><div className="mt-1 text-xs text-[var(--text-muted)]">收藏</div></GlassPanel>
          <GlassPanel blur="lg" className="rounded-[var(--radius-lg)] p-4 text-center"><div className="text-3xl font-semibold text-[var(--text-primary)]">{data.counts.pinned}</div><div className="mt-1 text-xs text-[var(--text-muted)]">置顶</div></GlassPanel>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]"><FolderKanban className="h-4 w-4 text-[var(--ai-accent)]" /> Focus / 项目推进</div>
          <Link href="/projects" className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">查看全部 <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {data.projects.length ? data.projects.map((project) => (
            <GlassPanel key={project.id} blur="lg" className="rounded-[var(--radius-lg)] p-4">
              <Link href={`/projects/${project.id}`}>
                <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-[var(--text-primary)]">{project.name}</h3><span className="rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.05)] px-3 py-1 text-xs text-[var(--text-muted)]">{project.noteCount} 条</span></div>
                <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{project.description || "继续推进这个项目的记录与沉淀。"}</p>
                <div className="mt-4 text-xs text-[var(--text-muted)]">最近活跃：{new Date(project.updatedAt).toLocaleString("zh-CN")}</div>
              </Link>
            </GlassPanel>
          )) : <GlassPanel blur="lg" className="rounded-[var(--radius-lg)] p-4 text-sm text-[var(--text-muted)]">还没有项目，去项目页创建第一个项目。</GlassPanel>}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="mb-3 flex items-center justify-between"><h2 className="inline-flex items-center gap-2 text-lg font-medium text-[var(--text-primary)]"><Sparkles className="h-4 w-4 text-[var(--ai-accent)]" /> Recent</h2><Link className="text-sm text-[var(--text-muted)]" href="/notes">查看全部</Link></div>
          {data.recent.length === 0 ? <GlassPanel blur="lg" className="rounded-[var(--radius-lg)] p-5 text-sm leading-7 text-[var(--text-muted)]">还没有笔记，先创建第一条记录。</GlassPanel> : null}
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 xl:grid-cols-2">
            {data.recent.map((note) => (
              <motion.div key={note.id} variants={staggerItem}>
                <NoteCard note={note} />
              </motion.div>
            ))}
          </motion.div>
        </div>
        <GlassPanel blur="lg" className="rounded-[var(--radius-lg)] p-5">
          <div className="inline-flex items-center gap-2 text-sm text-[var(--text-primary)]"><BrainCircuit className="h-4 w-4 text-[var(--ai-accent)]" /> 常用标签 / Memory cues</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(data.tags.length ? data.tags : ["暂无标签"]).map((tag, index) => (
              <Link key={tag} href={tag === "暂无标签" ? "/notes" : `/notes?tag=${encodeURIComponent(tag)}`} className={`rounded-full px-4 py-2 text-sm ${index === 0 ? "bg-[var(--primary)] text-[var(--text-primary)]" : "border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] text-[var(--text-secondary)]"}`}>
                {tag}
              </Link>
            ))}
          </div>
        </GlassPanel>
      </section>
    </div>
  );
}
