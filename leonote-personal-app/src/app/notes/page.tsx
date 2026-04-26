import { AppShell } from "@/components/app-shell";
import { ServerNoteList } from "@/components/server-note-list";

export default function NotesPage() {
  return (
    <AppShell title="全部笔记" subtitle="查看、搜索并继续编辑你的全部笔记。" current="/notes">
      <ServerNoteList />
    </AppShell>
  );
}
