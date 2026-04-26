import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { NoteCard } from "@/components/notes/NoteCard";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { toNoteDTO } from "@/lib/server-notes";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return <AppShell title="项目详情" subtitle="请先登录后查看项目详情。" current="/projects"><GlassPanel blur="lg" glow="soft" className="rounded-[28px] p-5 text-sm text-white/62">当前未登录。先去 <Link href="/login" className="font-medium text-white underline underline-offset-4">登录</Link>。</GlassPanel></AppShell>;
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
      <section className="mb-5 grid gap-3 md:grid-cols-3">
        <GlassPanel blur="lg" glow="soft" className="rounded-[24px] p-4 text-center"><div className="text-3xl font-semibold text-white">{notes.length}</div><div className="mt-1 text-xs text-white/42">项目笔记</div></GlassPanel>
        <GlassPanel blur="lg" glow="soft" className="rounded-[24px] p-4 text-center"><div className="text-3xl font-semibold text-white">{notes.filter((note) => note.favorite).length}</div><div className="mt-1 text-xs text-white/42">重点关注</div></GlassPanel>
        <GlassPanel blur="lg" glow="soft" className="rounded-[24px] p-4 text-center"><div className="text-3xl font-semibold text-white">{notes.filter((note) => note.pinned).length}</div><div className="mt-1 text-xs text-white/42">置顶</div></GlassPanel>
      </section>
      <section className="mb-4 flex items-center justify-between"><h2 className="text-lg font-medium text-white">项目笔记</h2><Link href="/notes/new" className="text-sm text-white/46">新建记录</Link></section>
      <section className="grid gap-4 xl:grid-cols-2">{notes.length ? notes.map((note) => <NoteCard key={note.id} note={{ ...note, updatedAt: note.updatedAt.toISOString() }} />) : <GlassPanel blur="lg" glow="soft" className="rounded-[24px] p-4 text-sm text-white/58">这个项目还没有笔记，先创建第一条项目记录。</GlassPanel>}</section>
    </AppShell>
  );
}
