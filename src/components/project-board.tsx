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

export function ProjectBoard({ initialProjects, signedIn }: { initialProjects: Project[]; signedIn: boolean }) {
  const [items, setItems] = useState<Project[]>(initialProjects);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState(signedIn ? "创建项目后，录入笔记时即可归属到该项目。" : "请先登录后再管理项目。");

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
        {items.map((project) => (
          <Link key={project.id} href={`/notes?projectId=${project.id}`} className="glass-panel block animate-rise rounded-[28px] p-5 transition-all duration-300 hover:-translate-y-[2px]">
            <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-medium text-[#111]">{project.name}</h2><div className="mt-1 text-xs text-[#888]">{project.status === "active" ? "进行中" : project.status || "活跃"}</div></div><span className="rounded-full bg-[#f3f2ef] px-3 py-1 text-xs text-[#666]">{project.noteCount} 条</span></div>
            <p className="mt-2 text-sm leading-6 text-[#666]">{project.description || "暂未填写项目简介。"}</p>
            {project.updatedAt ? <div className="mt-3 text-xs text-[#888]">最近活跃：{new Date(project.updatedAt).toLocaleString("zh-CN")}</div> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
