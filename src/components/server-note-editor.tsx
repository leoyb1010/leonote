"use client";

import { EnhancedEditor } from "@/components/editor/EnhancedEditor";

type NoteShape = {
  id?: string;
  title?: string;
  content?: string;
  tags?: string[];
  project?: { id: string; name: string } | null;
  attachments?: {
    id: string;
    noteId: string;
    filename: string;
    mimeType: string;
    size: number;
    url: string;
  }[];
};

export function ServerNoteEditor({ initialNote }: { initialNote?: NoteShape }) {
  return <EnhancedEditor initialNote={initialNote} />;
}
