"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { FolderKanban, MoveRight, Plus } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { NoteCard } from "@/components/notes/NoteCard";
import { Button, buttonClass } from "@/components/base/Button";
import { staggerContainer, staggerItem } from "@/lib/animations";

type PreviewNote = { id: string; title: string; excerpt: string; tags: string[]; favorite?: boolean; pinned?: boolean; archived?: boolean; updatedAt?: string };
type Project = { id: string; name: string; description: string; noteCount: number; updatedAt?: string; status?: string; previewNotes?: PreviewNote[] };

const STATUS_OPTIONS = [{ value: "active", label: "进行中" }, { value: "paused", label: "暂停中" }, { value: "done", label: "已完成" }];

export function ProjectBoard({ initialProjects, signedIn }: { initialProjects: Project[]; signedIn: boolean }) {
  const [items, setItems] = useState<Project[]>(initialProjects);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState(signedIn ? "创建项目后，录入笔记时即可归属到该项目。" : "请先登录后再管理项目。");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingStatus, setEditingStatus] = useState("active");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null);
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const projectLookup = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const load = async () => {
    const res = await fetch("/api/projects", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) { setMessage(data.message || "加载失败"); setItems([]); return; }
    setItems((data.projects || []).map((p: Project) => ({ ...p, previewNotes: projectLookup.get(p.id)?.previewNotes || p.previewNotes || [] })));
  };

  const createProject = async () => {
    if (!name.trim()) { setMessage("请先输入项目名称"); return; }
    const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description }) });
    const data = await res.json();
    if (!res.ok) { setMessage(data.message || "创建失败"); return; }
    setName(""); setDescription(""); setMessage("项目已创建。");
    await load();
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id); setEditingName(project.name); setEditingDescription(project.description || ""); setEditingStatus(project.status || "active");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const res = await fetch(`/api/projects/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editingName, description: editingDescription, status: editingStatus }) });
    const data = await res.json();
    if (!res.ok) { setMessage(data.message || "保存失败"); return; }
    setEditingId(null);
    setItems((cur) => cur.map((item) => (item.id === editingId ? { ...item, name: editingName, description: editingDescription, status: editingStatus } : item)));
    setMessage("项目已更新。");
  };

  const removeProject = async (project: Project) => {
    if (!window.confirm("确认删除项目？项目本身会删除，笔记保留但不归属该项目。")) return;
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (!res.ok) { setMessage("删除失败"); return; }
    if (editingId === project.id) setEditingId(null);
    setItems((cur) => cur.filter((item) => item.id !== project.id));
    setMessage("项目已移入回收站，仍可恢复。");
  };

  const moveNoteToProject = async (noteId: string, targetProjectId: string) => {
    const sourceProject = items.find((p) => p.previewNotes?.some((n) => n.id === noteId));
    const targetProject = items.find((p) => p.id === targetProjectId);
    if (!sourceProject || !targetProject || sourceProject.id === targetProjectId) return;
    const note = sourceProject.previewNotes?.find((n) => n.id === noteId);
    if (!note) return;
    setItems((cur) => cur.map((p) => {
      if (p.id === sourceProject.id) return { ...p, noteCount: Math.max(0, p.noteCount - 1), previewNotes: (p.previewNotes || []).filter((n) => n.id !== noteId) };
      if (p.id === targetProjectId) return { ...p, noteCount: p.noteCount + 1, previewNotes: [note, ...((p.previewNotes || []).filter((n) => n.id !== noteId))].slice(0, 4) };
      return p;
    }));
    const res = await fetch(`/api/notes/${noteId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: targetProjectId }) });
    if (!res.ok) { setMessage("迁移失败，已回滚。"); await load(); return; }
    setMessage("笔记已迁移。");
  };

  if (!signedIn) {
    return <GlassPanel blur="lg" className="rounded-[var(--radius-lg)] p-5 text-sm text-[var(--text-secondary)]">当前未登录。先去 <Link href="/login" className="font-medium text-[var(--primary)] underline underline-offset-4">登录</Link></GlassPanel>;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">项目</h1>

      <GlassPanel blur="xl" className="rounded-[var(--radius-lg)] p-5">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="text-xs font-semibold text-[var(--text-muted)]">New Project</div>
            <h2 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">新建项目</h2>
          </div>
          <span className="rounded-[var(--radius-pill)] border border-[var(--border-default)] bg-[var(--interactive-active)] px-3 py-1 text-xs text-[var(--text-muted)]">看板视图</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)_auto]">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="项目名称" className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)] focus:border-[var(--border-focus)] transition-colors" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="项目简介、目标或工作范围" className="min-h-[64px] w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)] focus:border-[var(--border-focus)] transition-colors resize-none" />
          <Button onClick={() => void createProject()} icon={<Plus size={16} />} className="w-full md:w-auto">创建项目</Button>
        </div>
      </GlassPanel>

      {message && (
        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--interactive-hover)] px-4 py-3 text-sm text-[var(--text-muted)]">{message}</div>
      )}

      <motion.div layout variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 xl:grid-cols-3">
        {items.map((project) => {
          const editing = editingId === project.id;
          const statusLabel = STATUS_OPTIONS.find((o) => o.value === (project.status || "active"))?.label ?? "进行中";
          return (
            <motion.div key={project.id} variants={staggerItem} layout>
              <GlassPanel blur="lg" className="rounded-[var(--radius-xl)] p-5 transition duration-300">
                {editing ? (
                  <div className="space-y-3">
                    <input value={editingName} onChange={(e) => setEditingName(e.target.value)} placeholder="项目名称" className="w-full h-10 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 text-sm text-[var(--text-primary)] outline-none" />
                    <textarea value={editingDescription} onChange={(e) => setEditingDescription(e.target.value)} placeholder="项目简介" className="min-h-[96px] w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none resize-none" />
                    <select value={editingStatus} onChange={(e) => setEditingStatus(e.target.value)} className="w-full h-10 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 text-sm text-[var(--text-primary)] outline-none">
                      {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => void saveEdit()}>保存修改</Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>取消</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="cursor-default">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-[var(--text-muted)]">{statusLabel}</div>
                          <h2 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{project.name}</h2>
                        </div>
                        <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[var(--interactive-active)] px-3 text-sm text-[var(--text-secondary)]">{project.noteCount}</span>
                      </div>
                      <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">{project.description || "暂未填写项目简介。"}</p>
                      {project.updatedAt && <div className="mt-4 text-xs text-[var(--text-muted)]">最近活跃：{new Date(project.updatedAt).toLocaleString("zh-CN")}</div>}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link href={`/projects/${project.id}`} className={buttonClass("secondary", "sm")}><MoveRight size={14} />看板详情</Link>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(project)}>编辑项目</Button>
                      <Button variant="danger" size="sm" onClick={() => void removeProject(project)}>删除项目</Button>
                    </div>
                    <div className={`mt-4 rounded-[var(--radius-sm)] border border-dashed px-3 py-3 transition ${dropTargetId === project.id ? "border-[var(--ai-accent)]/40 bg-[var(--ai-soft)]" : "border-[var(--border-default)] bg-[var(--surface-base)]"}`}
                      onDragOver={(e) => { e.preventDefault(); setDropTargetId(project.id); }}
                      onDragLeave={() => setDropTargetId((cur) => (cur === project.id ? null : cur))}
                      onDrop={(e) => { e.preventDefault(); const nid = e.dataTransfer.getData("text/plain"); setDropTargetId(null); setDraggingNoteId(null); void moveNoteToProject(nid, project.id); }}>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><FolderKanban size={14} />拖动下方笔记卡片到这里，可迁移到当前项目</div>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(project.previewNotes || []).length ? (project.previewNotes || []).map((note) => (
                        <div key={note.id} draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", note.id); setDraggingNoteId(note.id); setDraggingProjectId(project.id); }} onDragEnd={() => { setDraggingNoteId(null); setDraggingProjectId(null); setDropTargetId(null); }} className={draggingNoteId === note.id ? "opacity-60" : "opacity-100"}>
                          <NoteCard note={note} compact className="cursor-grab active:cursor-grabbing" />
                        </div>
                      )) : <div className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--interactive-hover)] px-3 py-3 text-xs text-[var(--text-muted)]">当前项目还没有可拖动的最近笔记。</div>}
                    </div>
                  </>
                )}
              </GlassPanel>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
