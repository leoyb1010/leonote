import Link from "next/link";
import { notFound } from "next/navigation";
import { NoteRow } from "@/components/notes/NoteRow";
import { Card } from "@/components/base/Card";
import { Button } from "@/components/base/Button";
import { EmptyState } from "@/components/base/EmptyState";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/session";
import { toNoteDTO } from "@/lib/server-notes";
import { FolderKanban, Plus } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return (
      <PageContainer width="wide">
        <p className="text-sm text-[var(--text-secondary)]">请先<Link href="/login" className="text-[var(--primary)] underline">登录</Link>后查看项目详情。</p>
      </PageContainer>
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
    <PageContainer width="wide">
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
          <Button size="sm" variant="secondary" asChild>
            <Link href="/notes/new">
              <Plus size={14} />
              新建
            </Link>
          </Button>
        </div>

        {notes.length === 0 ? (
          <EmptyState
            icon={<FolderKanban size={40} />}
            title="这个项目还很安静"
            description="写下第一条项目笔记，它会成为这个项目的起点。"
            action={{ label: "新建笔记", href: "/notes/new" }}
          />
        ) : (
          <div className="divide-y divide-[var(--border-subtle)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-1">
            {notes.map((note) => (
              <NoteRow key={note.id} note={{ ...note, updatedAt: note.updatedAt.toISOString() }} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
