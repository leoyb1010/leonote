import { ServerNoteDetailClient } from "@/components/server-note-detail-client";
import { AINotePanel } from "@/components/ai-note-panel";

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <ServerNoteDetailClient id={id} />
      <AINotePanel noteId={id} />
    </div>
  );
}
