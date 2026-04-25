import { AppShell } from "@/components/app-shell";
import { ServerNoteDetailClient } from "@/components/server-note-detail-client";
import { AINotePanel } from "@/components/ai-note-panel";

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <AppShell title="笔记详情" subtitle="查看与编辑当前笔记。" current="/">
      <div className="space-y-4">
        <ServerNoteDetailClient id={id} />
        <AINotePanel noteId={id} />
      </div>
    </AppShell>
  );
}
