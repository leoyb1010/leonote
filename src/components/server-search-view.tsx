"use client";

import { motion } from "framer-motion";
import { Filter, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { NoteCard } from "@/components/notes/NoteCard";
import { Card } from "@/components/base/Card";

type ApiNote = {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  archived?: boolean;
  favorite?: boolean;
  pinned?: boolean;
  project?: { id: string; name: string } | null;
  updatedAt?: string;
};

type Project = { id: string; name: string };

export function ServerSearchView() {
  const [items, setItems] = useState<ApiNote[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [archivedOnly, setArchivedOnly] = useState(false);
  const [message, setMessage] = useState("输入关键词开始搜索");

  useEffect(() => {
    fetch("/api/projects", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setProjects((data.projects || []).map((item: { id: string; name: string }) => ({ id: item.id, name: item.name }))))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (!query.trim() && !projectId && !favoriteOnly && !archivedOnly) {
        setItems([]);
        setMessage("输入关键词开始搜索");
        return;
      }
      const params = new URLSearchParams();
      const trimmedQuery = query.trim();
      if (trimmedQuery && trimmedQuery.length < 2 && !projectId && !favoriteOnly && !archivedOnly) {
        setItems([]);
        setMessage("请输入至少 2 个字符再搜索。");
        return;
      }
      if (trimmedQuery.length >= 2) params.set("q", trimmedQuery);
      if (projectId) params.set("projectId", projectId);
      if (archivedOnly) params.set("status", "archived");
      const res = await fetch(`/api/notes?${params.toString()}`, { cache: "no-store", signal: controller.signal });
      const data = await res.json();
      if (!res.ok) {
        setItems([]);
        setMessage(data.message || "搜索失败");
        return;
      }
      const list = favoriteOnly ? (data.notes || []).filter((note: { favorite: boolean }) => note.favorite) : (data.notes || []);
      setItems(list);
      setMessage(list.length ? "" : "没有找到匹配结果。");
    }, 260);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [query, projectId, favoriteOnly, archivedOnly]);

  return (
    <div className="max-w-[var(--content-max)] mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">搜索</h1>
      <Card padding="sm">
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-3">
          <Search size={16} className="text-[var(--text-muted)] shrink-0" />
          <input aria-label="搜索笔记" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索标题、正文、摘要、标签或项目" className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)]" />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[rgba(255,255,255,0.04)] px-3 py-3 text-sm text-[var(--text-secondary)]">
            <Filter size={16} className="text-[var(--text-muted)]" />
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full bg-transparent outline-none text-[var(--text-secondary)]">
              <option value="">全部项目</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => setFavoriteOnly((v) => !v)} className={`rounded-[var(--radius-sm)] px-4 py-3 text-sm transition-colors ${favoriteOnly ? "bg-[var(--primary)] text-[var(--text-primary)]" : "border border-[var(--border-default)] bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)]"}`}>仅看收藏</button>
          <button type="button" onClick={() => setArchivedOnly((v) => !v)} className={`rounded-[var(--radius-sm)] px-4 py-3 text-sm transition-colors ${archivedOnly ? "bg-[var(--primary)] text-[var(--text-primary)]" : "border border-[var(--border-default)] bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)]"}`}>仅看归档</button>
        </div>
      </Card>
      {message && <p className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-raised)] p-4 text-sm text-[var(--text-muted)]">{message}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((note, i) => (
          <motion.div key={note.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <NoteCard note={note} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
