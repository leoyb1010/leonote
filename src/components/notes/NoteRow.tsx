"use client";

import Link from "next/link";
import { Archive, FileText, Heart, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/date";

type NoteRowProps = {
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
  selected?: boolean;
  className?: string;
};

export function NoteRow({ note, href, selected = false, className }: NoteRowProps) {
  const destination = href ?? `/notes/${note.id}`;
  const tags = note.tags ?? [];

  return (
    <Link
      href={destination}
      className={cn(
        "group relative block rounded-[var(--radius-lg)] border border-transparent px-3.5 py-3",
        "transition-all duration-[var(--duration-quick)]",
        "hover:bg-[var(--interactive-hover)] hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(2,6,23,0.06)]",
        selected && "bg-[var(--interactive-selected)] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[2px] before:rounded-r-full before:bg-[var(--primary)]",
        className,
      )}
    >
      <div className="grid items-start gap-3 md:grid-cols-[minmax(0,1fr)_140px_120px]">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--material-inset)] text-[var(--text-muted)] sm:flex">
            <FileText size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              {note.pinned ? <Pin size={13} className="shrink-0 text-[var(--primary)]" /> : null}
              {note.favorite ? <Heart size={13} className="shrink-0 text-[var(--warning)]" /> : null}
              {note.archived ? <Archive size={13} className="shrink-0 text-[var(--text-muted)]" /> : null}
              <h3 className="truncate text-[15px] font-medium tracking-[-0.01em] text-[var(--text-primary)]">
                {note.title || "无标题"}
              </h3>
            </div>

            <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--text-muted)]">
              {note.excerpt || ""}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-[var(--text-faint)] md:pt-1">
          {note.project?.name ? (
            <span className="max-w-full truncate rounded-full bg-[var(--interactive-hover)] px-2 py-0.5 text-[var(--text-secondary)]">
              {note.project.name}
            </span>
          ) : null}
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="max-w-full truncate rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[var(--primary)]">
              #{tag}
            </span>
          ))}
          {tags.length > 2 ? <span className="text-[var(--text-faint)]">+{tags.length - 2}</span> : null}
        </div>

        {note.updatedAt ? (
          <time className="shrink-0 text-xs text-[var(--text-faint)] md:pt-1 md:text-right">
            {formatRelativeTime(note.updatedAt)}
          </time>
        ) : null}
      </div>
    </Link>
  );
}
