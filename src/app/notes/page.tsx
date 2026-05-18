import { ServerNoteList } from "@/components/server-note-list";
import { PageContainer } from "@/components/layout/PageContainer";

export default function NotesPage() {
  return (
    <PageContainer width="dashboard">
      <ServerNoteList />
    </PageContainer>
  );
}
