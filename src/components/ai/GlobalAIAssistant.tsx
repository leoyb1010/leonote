"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MessageSquareText, SendHorizonal, Sparkles, X } from "lucide-react";
import Markdown from "react-markdown";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/base/Button";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function pageContext() {
  const selection = window.getSelection()?.toString().trim() ?? "";
  const mainText = document.querySelector("main")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
  return {
    pathname: window.location.pathname,
    title: document.title,
    selectedText: selection.slice(0, 1200),
    visibleText: mainText.slice(0, 1800),
  };
}

export function GlobalAIAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const hidden = pathname === "/login";
  const placeholder = useMemo(() => {
    if (pathname.startsWith("/notes/")) return "围绕当前笔记继续想…";
    if (pathname.startsWith("/briefing")) return "帮我从今天简报里推演一层…";
    if (pathname.startsWith("/projects")) return "结合这个项目给我建议…";
    return "结合当前页面和我的笔记提问…";
  }, [pathname]);

  if (hidden) return null;

  async function ask() {
    const question = input.trim();
    if (!question || loading) return;
    const userMessage: Message = { id: `u-${Date.now()}`, role: "user", content: question };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, pageContext: pageContext() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "AI 请求失败");
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.answer || "我暂时没有形成可靠回答。",
        },
      ]);
    } catch (event) {
      setError(event instanceof Error ? event.message : "AI 暂时不可用");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed z-[65] inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--hairline)] bg-[var(--material-elevated)] text-[var(--ai-accent)] shadow-[var(--shadow-md)] transition hover:-translate-y-0.5 hover:bg-[var(--material-muted)]",
          "bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 md:bottom-5 md:right-5",
          open && "pointer-events-none opacity-0",
        )}
        aria-label="打开全局 AI 助手"
      >
        <Sparkles size={20} />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[80] md:pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-[var(--overlay-scrim)] backdrop-blur-sm md:hidden"
              aria-label="关闭 AI 助手"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ opacity: 0, y: 18, x: 0 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: 18, x: 0 }}
              transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
              className="card-premium pointer-events-auto absolute inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] flex max-h-[82dvh] flex-col overflow-hidden rounded-[var(--radius-2xl)] md:inset-x-auto md:bottom-5 md:right-5 md:top-5 md:w-[410px] md:max-h-none"
            >
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--hairline)] bg-[var(--material-elevated)] px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <MessageSquareText size={14} className="text-[var(--ai-accent)]" />
                    全局 AI
                  </div>
                  <h2 className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">
                    结合当前页面继续思考
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-[var(--hairline)] text-[var(--text-muted)] transition hover:bg-[var(--interactive-hover)] hover:text-[var(--text-primary)]"
                  aria-label="关闭 AI 助手"
                >
                  <X size={16} />
                </button>
              </header>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                  <div className="quiet-inset rounded-[var(--radius-lg)] px-4 py-5 text-sm leading-7 text-[var(--text-secondary)]">
                    我会带上当前页面路径、可见内容和你选中的文字，再结合你的笔记库回答。适合问“这条资讯对我意味着什么？”或“这篇笔记下一步怎么展开？”
                  </div>
                ) : null}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "rounded-[var(--radius-lg)] border px-3.5 py-3 text-sm leading-7",
                      message.role === "assistant"
                        ? "border-[var(--hairline)] bg-[var(--material-inset)] text-[var(--text-secondary)]"
                        : "border-[var(--hairline)] bg-[var(--interactive-hover)] text-[var(--text-primary)]",
                    )}
                  >
                    <div className="mb-1 text-[11px] text-[var(--text-muted)]">
                      {message.role === "assistant" ? "AI" : "你"}
                    </div>
                    <div className="prose-a:text-[var(--primary)] prose-strong:text-[var(--text-primary)] [&_p]:mb-2 [&_ul]:pl-4">
                      <Markdown>{message.content}</Markdown>
                    </div>
                  </div>
                ))}
                {loading ? (
                  <div className="flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3.5 py-3 text-sm text-[var(--text-muted)]">
                    <Loader2 size={14} className="animate-spin" />
                    正在结合当前页面思考…
                  </div>
                ) : null}
                {error ? (
                  <div className="rounded-[var(--radius-lg)] bg-[var(--danger-soft)] px-3.5 py-3 text-sm text-[var(--danger)]">
                    {error}
                  </div>
                ) : null}
              </div>

              <div className="shrink-0 border-t border-[var(--hairline)] bg-[var(--material-elevated)] p-3">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && event.shiftKey) {
                      event.preventDefault();
                      void ask();
                    }
                  }}
                  placeholder={placeholder}
                  className="min-h-[82px] w-full resize-none rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-2 text-sm leading-6 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-placeholder)]"
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-xs text-[var(--text-muted)]">Enter 换行 · Shift+Enter 发送</span>
                  <Button size="sm" onClick={() => void ask()} loading={loading} icon={!loading ? <SendHorizonal size={14} /> : undefined}>
                    发送
                  </Button>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
