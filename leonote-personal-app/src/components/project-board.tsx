"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { FolderKanban, MoveRight, Plus } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { NoteCard } from "@/components/notes/NoteCard";
import { staggerContainer, staggerItem } from "@/lib/animations";

type PreviewNote = {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  favorite?: boolean;
  pinned?: boolean;
  archived?: boolean;
  updatedAt?: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
  noteCount: number;
  updatedAt?: string;
  status?: string;
  previewNotes?: PreviewNote[];
};

const STATUS_OPTIONS = [
  { value: "active", label: "进行中" },
  { value: "paused", label: "暂停中" },
  { value: "done", label: "已完成" },
];

export function ProjectBoard({ initialProjects, signedIn }: { initialProjects: Project[]; signedIn: boolean }) {
  const [items, setItems] = useState<Project[]>(initialProjects);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState(signedIn ? "创建项目后，录入笔记时即可归属到该项目。拖动笔记卡片到其它项目，会立即完成真实迁移。" : "请先登录后再管理项目。");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingStatus, setEditingStatus] = useState("active");
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null);
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const projectLookup = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const load = async () => {
    const res = await fetch("/api/projects", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || "加载失败");
      setItems([]);
      return;
    }
    const merged = (data.projects || []).map((project: Project) => ({
      ...project,
      previewNotes: projectLookup.get(project.id)?.previewNotes || project.previewNotes || [],
    }));
    setItems(merged);
  };

  const createProject = async () => {
    if (!name.trim()) {
      setMessage("请先输入项目名称");
      return;
    }
    const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description }) });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || "创建失败");
      return;
    }
    setName("");
    setDescription("");
    setMessage("项目已创建，现在可以在录入笔记时填写所属项目。");
    await load();
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setEditingName(project.name);
    setEditingDescription(project.description || "");
    setEditingStatus(project.status || "active");
    setMessage(`正在编辑项目：${project.name}`);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const res = await fetch(`/api/projects/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingName, description: editingDescription, status: editingStatus }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || "保存失败");
      return;
    }
    setEditingId(null);
    setItems((current) => current.map((item) => (item.id === editingId ? { ...item, name: editingName, description: editingDescription, status: editingStatus } : item)));
    setMessage("项目已更新。已保持看板平滑刷新。");
  };

  const removeProject = async (project: Project) => {
    if (!window.confirm(`确认删除项目「${project.name}」？项目本身会删除，原项目下笔记会保留，但不再归属该项目。`)) return;
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({ ok: res.ok }));
    if (!res.ok) {
      setMessage(data.message || "删除失败");
      return;
    }
    if (editingId === project.id) setEditingId(null);
    setItems((current) => current.filter((item) => item.id !== project.id));
    setMessage("项目已删除，原项目下笔记已转为未归属项目。");
  };

  const moveNoteToProject = async (noteId: string, targetProjectId: string) => {
    const sourceProject = items.find((project) => project.previewNotes?.some((note) => note.id === noteId));
    const targetProject = items.find((project) => project.id === targetProjectId);
    if (!sourceProject || !targetProject || sourceProject.id === targetProjectId) return;

    const note = sourceProject.previewNotes?.find((item) => item.id === noteId);
    if (!note) return;

    setItems((current) => current.map((project) => {
      if (project.id === sourceProject.id) {
        return {
          ...project,
          noteCount: Math.max(0, project.noteCount - 1),
          previewNotes: (project.previewNotes || []).filter((item) => item.id !== noteId),
        };
      }
      if (project.id === targetProjectId) {
        return {
          ...project,
          noteCount: project.noteCount + 1,
          previewNotes: [note, ...(project.previewNotes || []).filter((item) => item.id !== noteId)].slice(0, 4),
        };
      }
      return project;
    }));

    const res = await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: targetProjectId }),
    });
    const data = await res.json().catch(() => ({ message: "迁移失败" }));
    if (!res.ok) {
      setMessage(data.message || "迁移失败，已回滚。");
      await load();
      return;
    }
    setMessage(`已将「${note.title}」移动到项目「${targetProject.name}」。`);
  };

  if (!signedIn) {
    return <GlassPanel blur="lg" glow="soft" className="rounded-[var(--radius-lg)] p-5 text-sm text-[var(--text-secondary)]">当前未登录。先去 <Link href="/login" className="font-medium text-white underline underline-offset-4">登录</Link>，再管理项目。</GlassPanel>;
  }

  return (
    <section className="space-y-5">
      <GlassPanel blur="xl" glow="brand" className="rounded-[var(--radius-lg)] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold text-[var(--text-muted)">New Project</div>
            <h2 className="mt-2 text-lg font-semibold text-white">新建项目</h2>
          </div>
          <span className="rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.05)] px-3 py-1 text-xs text-[var(--text-muted)">Linear-like board</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)_auto]">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="项目名称，例如 Leonote 2.0" className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-4 text-sm text-white outline-none focus:[box-shadow:0_0_0_4px_rgba(99,102,241,0.12)]" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="项目简介、目标或工作范围" className="min-h-[64px] w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-4 text-sm text-white outline-none focus:[box-shadow:0_0_0_4px_rgba(99,102,241,0.12)]" />
          <button type="button" onClick={() => void createProject()} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:brightness-110"><Plus className="h-4 w-4" /> 创建项目</button>
        </div>
      </GlassPanel>

      <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[rgba(255,255,255,0.05)] px-4 py-3 text-sm text-[var(--text-muted)]">{message}</div>

      <motion.div layout variants={staggerContainer} initial="initial" animate="animate" className="grid gap-4 xl:grid-cols-3">
        {items.map((project) => {
          const editing = editingId === project.id;
          const statusLabel = STATUS_OPTIONS.find((option) => option.value === (project.status || "active"))?.label ?? "进行中";
          return (
            <motion.div key={project.id} variants={staggerItem} layout>
              <GlassPanel
                blur="lg"
                glow={draggingProjectId === project.id || dropTargetId === project.id ? "brand" : "soft"}
                className="rounded-[26px] p-5 transition duration-300"
                hoverGlow
              >
                {editing ? (
                  <div className="space-y-3">
                    <input value={editingName} onChange={(event) => setEditingName(event.target.value)} className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-4 text-sm text-white outline-none" />
                    <textarea value={editingDescription} onChange={(event) => setEditingDescription(event.target.value)} className="min-h-[96px] w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-4 text-sm text-white outline-none" />
                    <select value={editingStatus} onChange={(event) => setEditingStatus(event.target.value)} className="w-full rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 py-3 text-sm text-white outline-none">
                      {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => void saveEdit()} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[var(--text-primary)]">保存修改</button>
                      <button type="button" onClick={() => setEditingId(null)} className="rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-4 py-2 text-sm text-[var(--text-secondary)]">取消</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="cursor-default">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-semibold text-[var(--text-muted)">{statusLabel}</div>
                          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-white">{project.name}</h2>
                        </div>
                        <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-3 text-sm text-[var(--text-secondary)]">{project.noteCount}</span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{project.description || "暂未填写项目简介。"}</p>
                      {project.updatedAt ? <div className="mt-4 text-xs text-[var(--text-muted)]">最近活跃：{new Date(project.updatedAt).toLocaleString("zh-CN")}</div> : null}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-3 py-2 text-xs text-[var(--text-secondary)] transition hover:bg-[rgba(255,255,255,0.10)]">看板详情 <MoveRight className="h-3.5 w-3.5" /></Link>
                      <Link href={`/notes?projectId=${project.id}`} className="rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-3 py-2 text-xs text-[var(--text-secondary)] transition hover:bg-[rgba(255,255,255,0.10)]">查看项目笔记</Link>
                      <button type="button" onClick={() => startEdit(project)} className="rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-3 py-2 text-xs text-[var(--text-secondary)] transition hover:bg-[rgba(255,255,255,0.10)]">编辑项目</button>
                      <button type="button" onClick={() => void removeProject(project)} className="rounded-full bg-[rgba(251,113,133,0.14)] px-3 py-2 text-xs text-rose-200 transition hover:bg-[rgba(251,113,133,0.20)]">删除项目</button>
                    </div>

                    <div
                      className={`mt-4 rounded-[var(--radius-sm)] border border-dashed px-3 py-3 transition ${dropTargetId === project.id ? "border-cyan-300/40 bg-cyan-300/8" : "border-[var(--border-default)] bg-[rgba(8,11,18,0.34)]"}`}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDropTargetId(project.id);
                      }}
                      onDragLeave={() => setDropTargetId((current) => (current === project.id ? null : current))}
                      onDrop={(event) => {
                        event.preventDefault();
                        const noteId = event.dataTransfer.getData("text/plain");
                        setDropTargetId(null);
                        setDraggingNoteId(null);
                        void moveNoteToProject(noteId, project.id);
                      }}
                    >
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)"><FolderKanban className="h-3.5 w-3.5" /> 拖动下方笔记卡片到这里，可直接迁移到当前项目。</div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {(project.previewNotes || []).length ? (project.previewNotes || []).map((note) => (
                        <div
                          key={note.id}
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData("text/plain", note.id);
                            setDraggingNoteId(note.id);
                            setDraggingProjectId(project.id);
                          }}
                          onDragEnd={() => {
                            setDraggingNoteId(null);
                            setDraggingProjectId(null);
                            setDropTargetId(null);
                          }}
                          className={draggingNoteId === note.id ? "opacity-60" : "opacity-100"}
                        >
                          <NoteCard note={note} compact className="cursor-grab active:cursor-grabbing" />
                        </div>
                      )) : <div className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[rgba(255,255,255,0.05)] px-3 py-3 text-xs text-[var(--text-muted)]">当前项目还没有可拖动的最近笔记。</div>}
                    </div>
                  </>
                )}
              </GlassPanel>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
