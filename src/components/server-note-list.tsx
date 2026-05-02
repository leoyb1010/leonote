"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { NoteCard } from "@/components/notes/NoteCard";
import { Card } from "@/components/base/Card";
import { EmptyState } from "@/components/base/EmptyState";

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
        setMessage(data.notes?.length ? "" : "当前还没有笔记");
      }
      setLoading(false);
    }, 280);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <div className="max-w-[var(--content-max)] mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] break-words">全部笔记</h1>

      <Card padding="sm">
        <div className="flex items-center gap-3">
          <Search size={16} className="text-[var(--text-muted)] shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索标题、内容、标签或项目"
            className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)]"
          />
        </div>
      </Card>

      {loading && items.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-8 text-center">{message}</p>
      ) : items.length === 0 && !loading ? (
        <EmptyState
          icon={<Search size={40} />}
          title="还没有笔记"
          description="记录一个想法，整理一段资料，开始构建你的第二大脑。"
          action={{ label: "新建笔记", href: "/notes/new" }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((note, i) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            >
              <NoteCard note={note} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
