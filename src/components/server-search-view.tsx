"use client";

import { motion } from "framer-motion";
import { Filter, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { NoteCard } from "@/components/notes/NoteCard";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { staggerContainer, staggerItem } from "@/lib/animations";

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
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, projectId, favoriteOnly, archivedOnly]);

  return (
    <section className="space-y-4">
      <GlassPanel blur="xl" glow="soft" className="rounded-[24px] p-4">
        <div className="flex items-center gap-3 rounded-[20px] border border-white/8 bg-[rgba(8,11,18,0.56)] px-4 py-3">
          <Search className="h-4 w-4 text-white/36" />
          <input aria-label="搜索笔记" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、正文、摘要、标签或项目" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/26" />
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="flex items-center gap-2 rounded-[18px] border border-white/8 bg-white/6 px-3 py-3 text-sm text-white/72">
            <Filter className="h-4 w-4 text-white/42" />
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="w-full bg-transparent outline-none">
              <option value="">全部项目</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => setFavoriteOnly((value) => !value)} className={`rounded-[18px] px-4 py-3 text-sm transition ${favoriteOnly ? "bg-white text-slate-900" : "border border-white/8 bg-white/6 text-white/72"}`}>仅看收藏</button>
          <button type="button" onClick={() => setArchivedOnly((value) => !value)} className={`rounded-[18px] px-4 py-3 text-sm transition ${archivedOnly ? "bg-white text-slate-900" : "border border-white/8 bg-white/6 text-white/72"}`}>仅看归档</button>
        </div>
      </GlassPanel>
      {message ? <GlassPanel blur="lg" glow="soft" className="rounded-[24px] p-4 text-sm text-white/62">{message}</GlassPanel> : null}
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
