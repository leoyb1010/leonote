import { ServerNoteDetailClient } from "@/components/server-note-detail-client";
import { AINotePanel } from "@/components/ai-note-panel";
import { PageContainer } from "@/components/layout/PageContainer";

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <PageContainer width="reader">
      <div className="space-y-4">
        <ServerNoteDetailClient id={id} />
        <AINotePanel noteId={id} />
      </div>
    </PageContainer>
  );
}
