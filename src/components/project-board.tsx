"use client";

import Link from "next/link";
import { useState } from "react";

type Project = {
  id: string;
  name: string;
  description: string;
  noteCount: number;
  updatedAt?: string;
  status?: string;
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
  const [message, setMessage] = useState(signedIn ? "创建项目后，录入笔记时即可归属到该项目。" : "请先登录后再管理项目。");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingStatus, setEditingStatus] = useState("active");

  const load = async () => {
    const res = await fetch("/api/projects", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.message || "加载失败");
      setItems([]);
      return;
    }
    setItems(data.projects || []);
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
    setMessage("项目已更新。");
    await load();
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
    setMessage("项目已删除，原项目下笔记已转为未归属项目。");
    await load();
  };

  if (!signedIn) {
    return <section className="glass-panel rounded-[28px] p-5 text-sm text-[#666]">当前未登录。先去 <Link href="/login" className="font-medium text-[#111] underline underline-offset-4">登录</Link>，再管理项目。</section>;
  }

  return (
    <section className="space-y-5">
      <div className="glass-panel animate-rise rounded-[28px] p-5">
        <div className="text-sm text-[#666]">新建项目</div>
        <div className="mt-4 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="项目名称，例如 Leonote 2.0" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm outline-none transition-all duration-300 focus:-translate-y-[1px] focus:bg-white focus:shadow-[0_16px_40px_rgba(0,0,0,0.06)]" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="项目简介、目标或工作范围" className="min-h-[110px] w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm outline-none transition-all duration-300 focus:-translate-y-[1px] focus:bg-white focus:shadow-[0_16px_40px_rgba(0,0,0,0.06)]" />
          <div className="flex items-center justify-between gap-3"><div className="text-xs text-[#777]">项目是一级入口，不只是标签。</div><button type="button" onClick={() => void createProject()} className="rounded-full bg-[#111] px-4 py-2 text-sm text-white transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_10px_24px_rgba(17,17,17,0.24)] active:scale-[0.98]">创建项目</button></div>
        </div>
      </div>

      <div className="rounded-2xl bg-white px-4 py-3 text-sm text-[#666] shadow-[0_10px_30px_rgba(0,0,0,0.04)]">{message}</div>

      <div className="space-y-3">
        {items.map((project) => {
          const editing = editingId === project.id;
          return (
            <div key={project.id} className="glass-panel animate-rise rounded-[28px] p-5 transition-all duration-300 hover:-translate-y-[2px]">
              {editing ? (
                <div className="space-y-3">
                  <input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm outline-none" />
                  <textarea value={editingDescription} onChange={(e) => setEditingDescription(e.target.value)} className="min-h-[96px] w-full rounded-2xl bg-[#f7f7f5] px-4 py-4 text-sm outline-none" />
                  <select value={editingStatus} onChange={(e) => setEditingStatus(e.target.value)} className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm outline-none">
                    {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void saveEdit()} className="rounded-full bg-[#111] px-4 py-2 text-sm text-white">保存修改</button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-full bg-[#f3f2ef] px-4 py-2 text-sm text-[#555]">取消</button>
                  </div>
                </div>
              ) : (
                <>
                  <Link href={`/projects/${project.id}`} className="block">
                    <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-medium text-[#111]">{project.name}</h2><div className="mt-1 text-xs text-[#888]">{project.status === "active" ? "进行中" : project.status === "paused" ? "暂停中" : project.status === "done" ? "已完成" : project.status || "活跃"}</div></div><span className="rounded-full bg-[#f3f2ef] px-3 py-1 text-xs text-[#666]">{project.noteCount} 条</span></div>
                    <p className="mt-2 text-sm leading-6 text-[#666]">{project.description || "暂未填写项目简介。"}</p>
                    {project.updatedAt ? <div className="mt-3 text-xs text-[#888]">最近活跃：{new Date(project.updatedAt).toLocaleString("zh-CN")}</div> : null}
                  </Link>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/notes?projectId=${project.id}`} className="rounded-full bg-[#f3f2ef] px-3 py-2 text-xs text-[#555]">查看项目笔记</Link>
                    <button type="button" onClick={() => startEdit(project)} className="rounded-full bg-[#f3f2ef] px-3 py-2 text-xs text-[#555]">编辑项目</button>
                    <button type="button" onClick={() => void removeProject(project)} className="rounded-full bg-[#111] px-3 py-2 text-xs text-white">删除项目</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
