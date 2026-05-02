"use client";

import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/base/Card";
import { EmptyState } from "@/components/base/EmptyState";
import { Button } from "@/components/base/Button";
import { Sun, FileText, FolderKanban, Sparkles, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

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
    recent: Array<{ id: string; title: string; excerpt: string; tags: string[] }>;
    tags: string[];
    projects: ProjectPreview[];
  } | null;
  signedIn: boolean;
}

export function TodayPage({ data, signedIn }: TodayPageProps) {
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
    return <EmptyState icon={<Sun size={40} />} title="加载中" description="正在获取你的知识库数据..." />;
  }

  const { recent, tags, counts, projects } = data;

  return (
    <div className="max-w-[var(--content-max)] mx-auto space-y-8 animate-fade-in">
      {/* Hero */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mb-2 break-words">Today</h1>
        <p className="text-sm text-[var(--text-muted)]">
          {counts.total > 0
            ? `${counts.total} 篇笔记 · ${counts.pinned} 置顶 · ${counts.favorite} 收藏`
            : "开始构建你的知识体系"}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Link href="/notes/new"><Button icon={<Plus size={16} />}>新建笔记</Button></Link>
        <Link href="/notes"><Button variant="secondary" icon={<FileText size={16} />}>全部笔记</Button></Link>
        <Link href="/projects"><Button variant="ghost" icon={<FolderKanban size={16} />}>项目</Button></Link>
        <Link href="/ai"><Button variant="ghost" icon={<Sparkles size={16} />}>AI 问答</Button></Link>
      </div>

      {/* Stats */}
      {counts.total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "总计", value: counts.total },
            { label: "置顶", value: counts.pinned },
            { label: "收藏", value: counts.favorite },
          ].map((stat) => (
            <Card key={stat.label} hover={false} padding="sm" className="text-center">
              <p className="text-lg font-bold text-[var(--text-primary)]">{stat.value}</p>
              <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Recent */}
      <section>
        <CardHeader>
          <CardTitle>最近笔记</CardTitle>
          {recent.length > 0 && (
            <Link href="/notes" className="text-xs text-[var(--primary)] hover:underline inline-flex items-center gap-1 shrink-0">
              查看全部 <ArrowRight size={12} />
            </Link>
          )}
        </CardHeader>
        {recent.length === 0 ? (
          <EmptyState
            icon={<FileText size={40} />}
            title="还没有笔记"
            description="记录一个想法，整理一段资料，开始构建你的第二大脑。"
            action={{ label: "新建笔记", href: "/notes/new" }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {recent.slice(0, 6).map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="min-w-0"
              >
                <Link href={`/notes/${note.id}`}>
                  <Card padding="sm">
                    <h3 className="text-sm font-medium text-[var(--text-primary)] line-clamp-1 mb-1 break-words">
                      {note.title || "无标题"}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2 break-words">
                      {note.excerpt || "暂无预览"}
                    </p>
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {note.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] break-words max-w-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Projects */}
      {projects.length > 0 && (
        <section>
          <CardHeader>
            <CardTitle>项目</CardTitle>
            <Link href="/projects" className="text-xs text-[var(--primary)] hover:underline inline-flex items-center gap-1 shrink-0">
              查看全部 <ArrowRight size={12} />
            </Link>
          </CardHeader>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((proj) => (
              <Link key={proj.id} href={`/projects/${proj.id}`}>
                <Card padding="sm" className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderKanban size={14} className="text-[var(--text-muted)] shrink-0" />
                    <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">{proj.name}</h3>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">{proj.noteCount} 篇笔记</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <section>
          <CardHeader>
            <CardTitle>常用标签</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] cursor-default break-words max-w-[200px]"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
