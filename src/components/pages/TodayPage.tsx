"use client";

import React, { useState } from "react";
import { Sun, FolderKanban, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { NoteRow } from "@/components/notes/NoteRow";
import { Button } from "@/components/base/Button";
import { formatRelativeTime } from "@/lib/date";

interface ProjectPreview {
  id: string;
  name: string;
  description: string | null;
  noteCount: number;
  updatedAt: string;
}

interface TodayPageProps {
  data: {
    counts: { total: number; favorite: number; pinned: number };
    recent: Array<{ id: string; title: string; excerpt: string; tags: string[]; updatedAt: string }>;
    tags: string[];
    projects: ProjectPreview[];
  } | null;
  signedIn: boolean;
}

function QuickCapture() {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastNoteId, setLastNoteId] = useState("");
  const [toast, setToast] = useState("");

  async function submit() {
    const text = value.trim();
    if (!text || saving) return;
    setSaving(true);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: text.split("\n")[0].slice(0, 80) || "快速记录",
        content: text,
        excerpt: text.slice(0, 120),
        tags: [],
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setValue("");
      setLastNoteId(data.note.id);
      setToast("已保存");
      setTimeout(() => setToast(""), 2500);
    }
  }

  return (
    <div className="relative">
      <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
            placeholder="快速记录一个想法……"
            className="h-9 flex-1 bg-transparent text-[15px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)]"
          />
          <kbd className="text-[10px] text-[var(--text-muted)] font-mono">⌘N</kbd>
        </div>
      </div>
      {toast && lastNoteId && (
        <div className="mt-2 text-xs">
          <span className="text-[var(--text-muted)]">{toast}</span>
          {" · "}
          <Link href={`/notes/${lastNoteId}`} className="text-[var(--primary)] hover:underline">
            查看
          </Link>
        </div>
      )}
    </div>
  );
}

const starterTemplates = [
  { icon: "📝", label: "今日记录", prompt: "今天的想法……" },
  { icon: "📚", label: "读书笔记", prompt: "这本书的核心观点是……" },
  { icon: "📋", label: "项目计划", prompt: "目标、里程碑和下一步……" },
  { icon: "💡", label: "灵感收集", prompt: "忽然想到一个点子……" },
];

export function TodayPage({ data, signedIn }: TodayPageProps) {
  const today = new Date();
  const dateStr = today.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  if (!signedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 mb-6 rounded-2xl bg-[var(--primary-soft)] flex items-center justify-center">
          <Sun size={32} className="text-[var(--primary)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Leonote</h1>
        <p className="text-base text-[var(--text-secondary)] max-w-sm mb-8 leading-relaxed">
          安静、可信、理性的个人知识工作台
        </p>
        <Link href="/login">
          <Button>登录或注册</Button>
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-sm text-[var(--text-muted)]">正在获取你的知识库数据...</p>
      </div>
    );
  }

  const { recent, tags, counts, projects } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <h1 className="text-[1.375rem] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
            今天
          </h1>
          {counts.total > 0 && (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {counts.total} 篇笔记 · {counts.pinned} 个置顶
              {projects.length > 0 && ` · ${projects.length} 个进行中项目`}
            </p>
          )}
        </div>
        <time className="shrink-0 text-sm text-[var(--text-muted)]">{dateStr}</time>
      </header>

      {/* QuickCapture */}
      <QuickCapture />

      {/* New Note ghost button */}
      <div className="flex justify-end">
        <Link href="/notes/new">
          <Button variant="ghost" size="sm" icon={<Plus size={14} />}>新建笔记</Button>
        </Link>
      </div>

      {/* Starter templates - only when no notes */}
      {counts.total === 0 && (
        <section className="grid gap-3 sm:grid-cols-2">
          {starterTemplates.map((template) => (
            <Link
              key={template.label}
              href={`/notes/new?title=${encodeURIComponent(template.label)}`}
              className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3.5 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{template.icon}</span>
                <span className="text-sm font-medium text-[var(--text-primary)]">{template.label}</span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{template.prompt}</p>
            </Link>
          ))}
        </section>
      )}

      {/* Recent Notes */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[var(--text-secondary)]">最近编辑</h2>
            <Link href="/notes" className="text-xs text-[var(--primary)] hover:underline inline-flex items-center gap-1">
              查看全部 <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-[var(--border-subtle)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-1">
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
            <Link href="/projects" className="text-xs text-[var(--primary)] hover:underline inline-flex items-center gap-1">
              查看全部 <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-[var(--border-subtle)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-1">
            {projects.slice(0, 4).map((proj) => (
              <Link
                key={proj.id}
                href={`/projects/${proj.id}`}
                className="flex items-center justify-between gap-4 px-3.5 py-3 transition-colors hover:bg-[rgba(255,255,255,0.03)]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FolderKanban size={14} className="text-[var(--text-muted)] shrink-0" />
                  <span className="truncate text-sm text-[var(--text-primary)]">{proj.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-[var(--text-muted)]">{proj.noteCount} 篇</span>
                  <span className="text-xs text-[var(--text-faint)]">{formatRelativeTime(proj.updatedAt)}</span>
                </div>
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
}
