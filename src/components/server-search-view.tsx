"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ApiNote = {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  archived?: boolean;
  favorite?: boolean;
  project?: { id: string; name: string } | null;
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
      if (query.trim()) params.set("q", query.trim());
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
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, projectId, favoriteOnly, archivedOnly]);

  return (
    <section className="space-y-4">
      <div className="glass-panel animate-rise rounded-[24px] p-4 transition-all duration-300 hover:shadow-[0_14px_32px_rgba(0,0,0,0.06)]">
        <input aria-label="搜索笔记" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索标题、正文、摘要、标签或项目" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm text-[#333] outline-none transition-all duration-200 focus:scale-[1.01] focus:bg-white focus:shadow-[0_0_0_1px_rgba(17,17,17,0.08)]" />
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-[#333] outline-none">
            <option value="">全部项目</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <button type="button" onClick={() => setFavoriteOnly((v) => !v)} className={`rounded-2xl px-4 py-3 text-sm transition-all duration-200 ${favoriteOnly ? "bg-[#111] text-white" : "bg-[#f7f7f5] text-[#333]"}`}>仅看收藏</button>
          <button type="button" onClick={() => setArchivedOnly((v) => !v)} className={`rounded-2xl px-4 py-3 text-sm transition-all duration-200 ${archivedOnly ? "bg-[#111] text-white" : "bg-[#f7f7f5] text-[#333]"}`}>仅看归档</button>
        </div>
      </div>
      {message ? <div className="glass-panel rounded-[24px] p-4 text-sm text-[#666]">{message}</div> : null}
      <div className="space-y-3">
        {items.map((note) => (
          <Link key={note.id} href={`/notes/${note.id}`} className="glass-panel block rounded-[24px] p-4 transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_14px_32px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between gap-3 text-xs text-[#888]"><span>{note.project?.name ? `项目 · ${note.project.name}` : note.tags.join(" · ") || "未分类"}</span><span>{note.favorite ? "已收藏" : note.archived ? "已归档" : ""}</span></div>
            <h2 className="mt-2 text-base font-medium">{note.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#666]">{note.excerpt}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
