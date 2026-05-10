"use client";

import { Search } from "lucide-react";
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

  return (
    <div className="space-y-5">
      <PageHeader
        title="全部笔记"
        description={items.length > 0 ? `${items.length} 篇笔记` : undefined}
        actions={
          <Button size="sm" className="w-full sm:w-auto" asChild>
            <Link href="/notes/new">新建</Link>
          </Button>
        }
      />

      <div className="rounded-[var(--radius-lg)] bg-[var(--surface-1)] px-3.5 py-2.5 ring-1 ring-[var(--border-default)]">
        <div className="flex items-center gap-3">
          <Search size={16} className="text-[var(--text-muted)] shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索标题、内容、标签或项目"
            className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)]"
          />
        </div>
      </div>

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
        <div className="divide-y divide-[var(--border-subtle)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-1">
          {items.map((note) => (
            <NoteRow key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  );
}
