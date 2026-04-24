import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { toNoteDTO } from "@/lib/server-notes";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return <AppShell title="项目详情" subtitle="请先登录后查看项目详情。" current="/projects"><section className="glass-panel rounded-[28px] p-5 text-sm text-[#666]">当前未登录。先去 <Link href="/login" className="font-medium text-[#111] underline underline-offset-4">登录</Link>。</section></AppShell>;
  }

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId },
    include: { notes: { where: { deletedAt: null }, orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }], include: { project: true, tags: { include: { tag: true } } } } },
  });

  if (!project) notFound();
  const notes = project.notes.map(toNoteDTO);

  return (
    <AppShell title={project.name} subtitle={project.description || "项目详情与最近笔记。"} current="/projects">
      <section className="mb-5 grid grid-cols-3 gap-3">
        <div className="glass-panel rounded-[24px] p-4 text-center"><div className="text-2xl font-semibold">{notes.length}</div><div className="mt-1 text-xs text-[#777]">项目笔记</div></div>
        <div className="glass-panel rounded-[24px] p-4 text-center"><div className="text-2xl font-semibold">{notes.filter((note) => note.favorite).length}</div><div className="mt-1 text-xs text-[#777]">重点关注</div></div>
        <div className="glass-panel rounded-[24px] p-4 text-center"><div className="text-2xl font-semibold">{notes.filter((note) => note.pinned).length}</div><div className="mt-1 text-xs text-[#777]">置顶</div></div>
      </section>
      <section className="mb-4 flex items-center justify-between"><h2 className="text-lg font-medium">项目笔记</h2><Link href="/notes/new" className="text-sm text-[#777]">新建记录</Link></section>
      <section className="space-y-3">{notes.length ? notes.map((note) => <Link key={note.id} href={`/notes/${note.id}`} className="glass-panel block rounded-[24px] p-4 transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_14px_32px_rgba(0,0,0,0.06)]"><div className="flex items-center justify-between gap-3 text-xs text-[#888]"><span>{note.tags.join(" · ") || "未分类"}</span><span>{note.updatedAt.toLocaleString("zh-CN")}</span></div><h3 className="mt-2 text-base font-medium text-[#111]">{note.title}</h3><p className="mt-2 text-sm leading-6 text-[#666]">{note.excerpt}</p></Link>) : <div className="glass-panel rounded-[24px] p-4 text-sm text-[#666]">这个项目还没有笔记，先创建第一条项目记录。</div>}</section>
    </AppShell>
  );
}
