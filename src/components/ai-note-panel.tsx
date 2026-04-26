"use client";

import { AIChatPanel } from "@/components/ai/AIChatPanel";

export function AINotePanel({ noteId }: { noteId: string }) {
  return <AIChatPanel noteId={noteId} />;
}
