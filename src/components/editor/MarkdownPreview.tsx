"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="markdown-preview text-sm leading-relaxed text-[var(--text-secondary)]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {content || "暂无内容"}
      </ReactMarkdown>
    </div>
  );
}
