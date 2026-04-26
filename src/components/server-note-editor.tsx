"use client";

import { EnhancedEditor } from "@/components/editor/EnhancedEditor";

type NoteShape = {
  id?: string;
  title?: string;
  content?: string;
  tags?: string[];
  project?: { id: string; name: string } | null;
};

export function ServerNoteEditor({ initialNote }: { initialNote?: NoteShape }) {
  return <EnhancedEditor initialNote={initialNote} />;
}
