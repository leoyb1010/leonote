"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { NoteCard } from "@/components/notes/NoteCard";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { staggerContainer, staggerItem } from "@/lib/animations";

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

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/notes?${params.toString()}`, { cache: "no-store", signal: controller.signal });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.message || "请先登录");
        setItems([]);
        return;
      }
      setItems(data.notes || []);
      setMessage(data.notes?.length ? "" : "当前还没有笔记");
    }, 280);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <section className="space-y-5">
      <GlassPanel blur="xl" glow="soft" className="rounded-[var(--radius-lg)] p-4">
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-3">
          <Search className="h-4 w-4 text-[36" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、内容、标签或项目" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[var(--text-placeholder)" />
        </div>
      </GlassPanel>

      {message ? <GlassPanel blur="lg" glow="soft" className="rounded-[var(--radius-lg)] p-4 text-sm text-[var(--text-secondary)]">{message}</GlassPanel> : null}

      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 xl:grid-cols-2">
        {items.map((note) => (
          <motion.div key={note.id} variants={staggerItem}>
            <NoteCard note={note} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
