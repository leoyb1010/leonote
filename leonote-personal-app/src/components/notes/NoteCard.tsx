"use client";

import Link from "next/link";
import { Archive, Heart, Pin } from "lucide-react";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { cn } from "@/lib/utils";

type NoteCardProps = {
  note: {
    id: string;
    title: string;
    excerpt: string;
    tags?: string[];
    project?: { name?: string } | null;
    updatedAt?: string;
    favorite?: boolean;
    archived?: boolean;
    pinned?: boolean;
  };
  href?: string;
  compact?: boolean;
  className?: string;
};

export function NoteCard({ note, href, compact = false, className }: NoteCardProps) {
  const destination = href ?? `/notes/${note.id}`;
  const badges = [
    note.favorite ? { key: "favorite", label: "收藏", icon: Heart } : null,
    note.pinned ? { key: "pinned", label: "置顶", icon: Pin } : null,
    note.archived ? { key: "archived", label: "归档", icon: Archive } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; icon: typeof Heart }>;

  return (
    <Link href={destination} className="block [perspective:1200px]">
      <AnimatedCard className={cn("rounded-[var(--radius-lg)]", className)} contentClassName="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-[44">
              {note.project?.name ? `项目 · ${note.project.name}` : note.tags?.[0] ?? "未分类"}
            </div>
            <h3 className="mt-2 line-clamp-2 text-base font-semibold tracking-[-0.02em] text-white">{note.title}</h3>
          </div>
          {badges.length ? (
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              {badges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <span key={badge.key} className="inline-flex h-8 items-center gap-1 rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-2.5 text-[11px] text-[var(--text-secondary)]">
                    <Icon className="h-3.5 w-3.5" />
                    {!compact ? badge.label : null}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-7 text-[66">{note.excerpt}</p>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
          <div className="flex flex-wrap gap-2">
            {(note.tags ?? []).slice(0, compact ? 2 : 3).map((tag) => (
              <span key={tag} className="rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.05)] px-2.5 py-1">#{tag}</span>
            ))}
          </div>
          {note.updatedAt ? <span>{new Date(note.updatedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span> : null}
        </div>
      </AnimatedCard>
    </Link>
  );
}
