import Link from "next/link";
import { notFound } from "next/navigation";
import { NoteCard } from "@/components/notes/NoteCard";
import { Card } from "@/components/base/Card";
import { Button } from "@/components/base/Button";
import { EmptyState } from "@/components/base/EmptyState";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { toNoteDTO } from "@/lib/server-notes";
import { FolderKanban, Plus } from "lucide-react";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return (
      <div className="max-w-[var(--content-max)] mx-auto">
        <p className="text-sm text-[var(--text-secondary)]">请先<Link href="/login" className="text-[var(--primary)] underline">登录</Link>后查看项目详情。</p>
      </div>
    );
  }

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId },
    include: {
      notes: {
        where: { deletedAt: null },
        orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
        include: { project: true, tags: { include: { tag: true } } },
      },
    },
  });

  if (!project) notFound();
  const notes = project.notes.map(toNoteDTO);
  const favCount = notes.filter((note) => note.favorite).length;
  const pinCount = notes.filter((note) => note.pinned).length;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <FolderKanban size={22} className="text-[var(--primary)]" />
          {project.name}
        </h1>
        {project.description && (
          <p className="text-sm text-[var(--text-muted)] mt-1">{project.description}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "项目笔记", value: notes.length },
          { label: "重点关注", value: favCount },
          { label: "置顶", value: pinCount },
        ].map((stat) => (
          <Card key={stat.label} hover={false} padding="sm" className="text-center">
            <div className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</div>
            <div className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">项目笔记</h2>
        <Link href="/notes/new">
          <Button size="sm" variant="secondary" icon={<Plus size={14} />}>新建</Button>
        </Link>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={40} />}
          title="还没有项目笔记"
          description="创建第一条项目记录，开始整理你的知识。"
          action={{ label: "新建笔记", href: "/notes/new" }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {notes.map((note) => (
            <NoteCard key={note.id} note={{ ...note, updatedAt: note.updatedAt.toISOString() }} />
          ))}
        </div>
      )}
    </div>
  );
}
