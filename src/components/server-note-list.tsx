"use client";

import { Archive, BookOpenText, CalendarClock, FilePlus2, Heart, Library, Pin, Search, Tags } from "lucide-react";
import { useEffect, useState } from "react";
import { NoteRow } from "@/components/notes/NoteRow";
import { EmptyState } from "@/components/base/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import Link from "next/link";
import { Button } from "@/components/base/Button";

type ApiNote = {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  project?: { name: string } | null;
  updatedAt?: string;
  favorite?: boolean;
  archived?: boolean;
  pinned?: boolean;
};

export function ServerNoteList() {
  const [items, setItems] = useState<ApiNote[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("正在加载服务端数据…");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/notes?${params.toString()}`, { cache: "no-store", signal: controller.signal });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "请先登录");
        setItems([]);
      } else {
        setItems(data.notes || []);
        setMessage(data.notes?.length ? "" : "这里还很安静，写下第一条想法。");
      }
      setLoading(false);
    }, 280);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const pinned = items.filter((item) => item.pinned).length;
  const favorite = items.filter((item) => item.favorite).length;
  const archived = items.filter((item) => item.archived).length;
  const tagCount = new Set(items.flatMap((item) => item.tags ?? [])).size;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Object Library"
        icon={<Library size={19} />}
        title="笔记库"
        description={items.length > 0 ? `${items.length} 篇笔记 · ${tagCount} 个标签` : "所有记录、项目和标签的统一入口。"}
        actions={
          <Button size="md" icon={<FilePlus2 size={15} />} className="w-full sm:w-auto" asChild>
            <Link href="/notes/new">新建笔记</Link>
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <LibraryMetric icon={<BookOpenText size={15} />} label="当前结果" value={String(items.length)} hint={query.trim() ? "匹配搜索条件" : "全部可见笔记"} />
        <LibraryMetric icon={<Pin size={15} />} label="置顶" value={String(pinned)} hint="优先处理内容" />
        <LibraryMetric icon={<Heart size={15} />} label="收藏" value={String(favorite)} hint="长期回看内容" />
        <LibraryMetric icon={<Archive size={15} />} label="归档" value={String(archived)} hint="已沉淀内容" />
      </section>

      <section className="rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-3 shadow-[var(--shadow-sm)]">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="flex h-12 min-w-0 items-center gap-3 rounded-xl border border-[var(--hairline)] bg-[var(--material-inset)] px-3 text-sm text-[var(--text-secondary)]">
            <Search size={16} className="shrink-0 text-[var(--text-muted)]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索标题、内容、标签或项目"
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)]"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <LibraryChip icon={<CalendarClock size={13} />} label="最近更新" active />
            <LibraryChip icon={<Tags size={13} />} label="标签" />
            <LibraryChip icon={<Pin size={13} />} label="置顶" />
          </div>
        </div>
      </section>

      {loading && items.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-8 text-center">{message}</p>
      ) : items.length === 0 && !loading ? (
        <EmptyState
          icon={<Search size={40} />}
          title="这里还很安静"
          description="写下第一条想法，它会成为你的起点。"
          action={{ label: "开始书写", href: "/notes/new" }}
        />
      ) : (
        <section className="rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-1 shadow-[var(--shadow-sm)]">
          <div className="hidden grid-cols-[minmax(0,1fr)_140px_120px] gap-3 border-b border-[var(--hairline)] px-4 py-2 text-[11px] text-[var(--text-muted)] md:grid">
            <span>标题与摘要</span>
            <span>项目 / 标签</span>
            <span className="text-right">更新</span>
          </div>
          <div className="divide-y divide-[var(--hairline)]">
            {items.map((note) => (
              <NoteRow key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function LibraryMetric({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="quiet-inset rounded-[var(--radius-xl)] p-4">
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--material-elevated)] text-[var(--text-secondary)]">{icon}</span>
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold text-[var(--text-primary)] numeric-display">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>
    </div>
  );
}

function LibraryChip({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <span className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs ${
      active
        ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
        : "border-[var(--hairline)] text-[var(--text-muted)]"
    }`}>
      {icon}
      {label}
    </span>
  );
}
