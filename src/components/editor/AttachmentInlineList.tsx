"use client";

import { Image as ImageIcon, Paperclip, Trash2 } from "lucide-react";

export type Attachment = {
  id: string;
  noteId: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
};

type Props = {
  attachments: Attachment[];
  onRemove: (attachment: Attachment) => void | Promise<void>;
};

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentInlineList({ attachments, onRemove }: Props) {
  if (attachments.length === 0) return null;

  return (
    <div className="mt-3 grid gap-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex min-w-0 items-center gap-2 rounded-md border border-[var(--hairline)] bg-[var(--surface-base)] px-2.5 py-2"
        >
          {attachment.mimeType.startsWith("image/") ? (
            <ImageIcon className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
          ) : (
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
          )}
          <a
            href={attachment.url}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 truncate text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {attachment.filename}
          </a>
          <span className="shrink-0 text-[var(--text-faint)]">{formatFileSize(attachment.size)}</span>
          <button
            type="button"
            onClick={() => void onRemove(attachment)}
            className="shrink-0 rounded-md p-1 text-[var(--text-muted)] transition hover:bg-[var(--interactive-hover)] hover:text-[var(--danger)]"
            aria-label={`删除附件 ${attachment.filename}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
