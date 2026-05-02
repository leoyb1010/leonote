"use client";

import Link from "next/link";
import { Archive, Heart, Pin } from "lucide-react";
import { Card } from "@/components/base/Card";
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
    <Link href={destination} className="block group">
      <Card className={cn("transition-colors", className)} padding="sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              {note.project?.name ? `项目 · ${note.project.name}` : note.tags?.[0] ?? "未分类"}
            </div>
            <h3 className="mt-1.5 line-clamp-2 text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
              {note.title || "无标题"}
            </h3>
            {!compact && note.excerpt && (
              <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)] leading-relaxed">
                {note.excerpt}
              </p>
            )}
          </div>
          {badges.length > 0 && (
            <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
              {badges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <span
                    key={badge.key}
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--surface-base)] px-2 py-1 text-xs text-[var(--text-muted)]"
                  >
                    <Icon size={12} />
                    {!compact && badge.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        {note.tags && note.tags.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {note.updatedAt && (
          <div className="mt-3 text-xs text-[var(--text-muted)]">
            {new Date(note.updatedAt).toLocaleDateString("zh-CN")}
          </div>
        )}
      </Card>
    </Link>
  );
}
