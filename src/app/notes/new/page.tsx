import { ServerNoteEditor } from "@/components/server-note-editor";
import { PageContainer } from "@/components/layout/PageContainer";

export default function NewNotePage() {
  return (
    <PageContainer width="reader">
      <ServerNoteEditor />
    </PageContainer>
  );
}
