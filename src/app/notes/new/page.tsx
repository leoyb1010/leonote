import { AppShell } from "@/components/app-shell";
import { ServerNoteEditor } from "@/components/server-note-editor";

export default function NewNotePage() {
  return (
    <AppShell title="新建笔记" subtitle="支持直接保存、导入后继续编辑，保持最短记录路径。" current="/">
      <ServerNoteEditor />
    </AppShell>
  );
}
