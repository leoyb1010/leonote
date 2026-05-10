"use client";

import React, { useState } from "react";
import Link from "next/link";
import Markdown from "react-markdown";
import { Card } from "@/components/base/Card";
import { Button } from "@/components/base/Button";
import { EmptyState } from "@/components/base/EmptyState";
import { Sparkles, Send, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

interface Message {
  role: "user" | "assistant";
  content: string;
  notesUsed?: Array<{ id: string; title: string; excerpt?: string }>;
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ask = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg.content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "AI 请求失败");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || "AI 暂未返回内容",
          notesUsed: Array.isArray(data.notesUsed) ? data.notesUsed : [],
        },
      ]);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err.message || "请求失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer width="ai">
      <PageHeader
        title="AI 助手"
        actions={<Sparkles size={22} className="text-[var(--ai-accent)]" />}
      />

      {/* Chat */}
      <div className="space-y-4 min-h-[400px]">
        {messages.length === 0 && (
          <EmptyState
            icon={<Sparkles size={40} className="text-[var(--ai-accent)]" />}
            title="向 AI 提问"
            description="可以问关于你的笔记库的任何问题，AI 会结合你的知识库回答。"
          />
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <Card padding="sm">
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">
                    {msg.role === "user" ? "你" : "AI"}
                  </span>
                  {msg.role === "assistant" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--ai-soft)] text-[var(--ai-accent)]">
                      AI 生成
                    </span>
                  )}
                </div>
                <div className="text-sm text-[var(--text-secondary)] leading-relaxed prose-a:text-[var(--primary)] prose-strong:text-[var(--text-primary)] [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:text-[var(--text-primary)] [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-[14px] [&_h3]:font-medium [&_h3]:text-[var(--text-secondary)] [&_h3]:mt-3 [&_h3]:mb-1.5 [&_ul]:pl-4 [&_ul]:space-y-1 [&_li]:leading-relaxed [&_p]:mb-2 [&_hr]:border-[var(--hairline)] [&_hr]:my-3">
                  <Markdown>{msg.content}</Markdown>
                </div>
                {msg.role === "assistant" && msg.notesUsed && msg.notesUsed.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.notesUsed.slice(0, 6).map((note) => (
                      <Link
                        key={note.id}
                        href={`/notes/${note.id}`}
                        className="max-w-full truncate rounded-full border border-[var(--hairline)] bg-[var(--interactive-hover)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        引用：{note.title || "未命名笔记"}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card padding="sm">
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <RefreshCw size={14} className="animate-spin" />
                AI 思考中...
              </div>
            </Card>
          </motion.div>
        )}

        {error && (
          <div className="text-sm text-[var(--danger)] p-3 rounded-md bg-[var(--danger-soft)]">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); ask(); } }}
          placeholder="向 AI 提问，比如「总结我最近一周的笔记要点」"
          className="flex-1 h-10 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] px-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)] focus:border-[var(--border-focus)] transition-colors"
        />
        <Button size="lg" onClick={ask} loading={loading} icon={!loading ? <Send size={16} /> : undefined}>
          发送
        </Button>
      </div>
    </PageContainer>
  );
}
