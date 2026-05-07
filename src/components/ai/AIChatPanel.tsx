"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrainCircuit, SendHorizonal, Sparkles, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/base/Button";
import Markdown from "react-markdown";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";

type MemoryItem = { id: string; type?: string; label: string; content?: string; confidence?: number };
type MemoryRef = { id: string; label: string; reason?: string };
type ChatMessage = { id: string; role: "user" | "assistant"; text: string; memoryRefs?: MemoryRef[] };

const thinkingLines = [
  "正在静读这篇笔记…",
  "正在寻找其中的脉络…",
  "正在和你的长期记忆对齐…",
];

function ThinkingLine() {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLine((p) => (p + 1) % thinkingLines.length), 1200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]/40 animate-pulse" />
      {thinkingLines[line]}
    </div>
  );
}

export function AIChatPanel({ noteId, linkedMemories = [] }: { noteId: string; linkedMemories?: Array<{ id: string; label: string; content?: string }> }) {
  const reduceMotion = useReducedMotion();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState<"summary" | "ask" | "memory" | "">("");
  const [message, setMessage] = useState("我可以帮你看见这篇笔记里的脉络。");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [summaryCard, setSummaryCard] = useState("");
  const [memories, setMemories] = useState<MemoryItem[]>(
    linkedMemories.map((item) => ({ id: item.id, label: item.label, content: item.content })),
  );

  useEffect(() => {
    if (linkedMemories.length) return;
    let active = true;
    fetch("/api/ai/memories", { cache: "no-store" })
      .then((res) => res.json().then((d) => ({ ok: res.ok, d })))
      .then(({ ok, d }) => {
        if (!active || !ok) return;
        setMemories((d.items || []).map((item: { id: string; type: string; content: string; confidence: number }) => ({
          id: item.id, type: item.type, label: item.type, content: item.content, confidence: item.confidence,
        })));
      });
    return () => { active = false; };
  }, [linkedMemories]);

  useEffect(() => {
    if (!highlightedIds.length) return;
    const t = window.setTimeout(() => setHighlightedIds([]), 2200);
    return () => window.clearTimeout(t);
  }, [highlightedIds]);

  const typeAppend = async (text: string, refs?: MemoryRef[]) => {
    const id = `a-${Date.now()}`;
    if (reduceMotion) { setMessages((m) => [...m, { id, role: "assistant", text, memoryRefs: refs }]); return; }
    let draft = "";
    setMessages((m) => [...m, { id, role: "assistant", text: "", memoryRefs: refs }]);
    for (let i = 0; i < text.length; i += 5) {
      draft += text.slice(i, i + 5);
      await new Promise<void>((r) => setTimeout(() => { setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, text: draft } : msg))); r(); }, 24));
    }
  };

  const callAi = async (endpoint: string) => {
    const res = await fetch(`/api/ai/notes/${noteId}/${endpoint}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "失败");
    return data;
  };

  const runSummary = async () => {
    setLoading("summary");
    setMessage("");
    try {
      const data = await callAi("summarize");
      setSummaryCard(data.summary || data.content || "未返回总结");
    } catch (e: unknown) { setMessage((e as Error).message); }
    setLoading("");
  };

  const ask = async () => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setQuestion("");
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", text: q }]);
    setLoading("ask");
    try {
      const data = await fetch(`/api/ai/notes/${noteId}/ask`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q }),
      }).then((r) => r.json());
      if (!data.answer) throw new Error(data.message || "无回复");
      const refs = data.memoryRefs?.map((r: { id: string; content?: string; reason?: string }) => ({ id: r.id, label: r.content?.slice(0, 18) || "", reason: r.reason }));
      await typeAppend(data.answer, refs);
      if (refs?.length) setHighlightedIds(refs.map((r: { id: string }) => r.id));
    } catch (e: unknown) { setMessage((e as Error).message); }
    setLoading("");
  };

  const extractMemory = async () => {
    setLoading("memory");
    setMessage("");
    try {
      await callAi("memory");
      setMessage("这条记忆已经被放入长期脉络。");
    } catch (e: unknown) { setMessage((e as Error).message); }
    setLoading("");
  };

  return (
    <div className="space-y-4">
      {/* v1.4 Summary Card */}
      {summaryCard && (
        <section className="rounded-[28px] border border-[var(--hairline)] bg-[var(--material-elevated)] p-5 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={16} className="text-[var(--ai-accent)]" />
            <span className="text-xs font-medium text-[var(--text-muted)]">静读</span>
          </div>
          <div className="space-y-4 text-sm leading-relaxed">
            <section>
              <div className="text-xs text-[var(--text-muted)] mb-1">核心</div>
              <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{summaryCard}</p>
            </section>
          </div>
        </section>
      )}

      {/* v1.4 Main AI Panel */}
      <section className="rounded-[28px] border border-[var(--hairline)] bg-[var(--material-elevated)] p-5 shadow-[var(--shadow-sm)]">
        <div className="space-y-4">
          <div>
            <div className="text-xs text-[var(--text-muted)]">静读助手</div>
            <h3 className="mt-2 text-lg font-medium tracking-[-0.02em] text-[var(--text-primary)]">我可以帮你看见这篇笔记里的脉络。</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" loading={loading === "summary"} icon={<BookOpen size={14} />} onClick={() => void runSummary()}>
              提炼要点
            </Button>
            <Button variant="secondary" size="sm" loading={loading === "memory"} icon={<BrainCircuit size={14} />} onClick={() => void extractMemory()}>
              整理成长期记忆
            </Button>
          </div>

          {/* v1.4 Memories */}
          {memories.length > 0 && (
            <div className="columns-1 gap-3 md:columns-2">
              {memories.map((mem) => (
                <div
                  key={mem.id}
                  className={cn(
                    "rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--material-inset)] p-4 mb-3 break-inside-avoid",
                    highlightedIds.includes(mem.id) && "ring-1 ring-[var(--ai-accent)]/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                    <span>{mem.type || "长期记忆"}</span>
                    <BrainCircuit size={14} className="text-[var(--ai-accent)]" />
                  </div>
                  <h4 className="mt-2 text-sm font-medium text-[var(--text-primary)]">{mem.label}</h4>
                  {mem.content && <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">{mem.content}</p>}
                </div>
              ))}
            </div>
          )}

          {/* v1.4 Thinking State */}
          {loading && (
            <div className="rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--material-inset)] px-4 py-4">
              <ThinkingLine />
            </div>
          )}

          {/* v1.4 Chat Messages */}
          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
            {messages.length === 0 && !loading ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--material-inset)] px-4 py-4 text-sm text-[var(--text-muted)] leading-relaxed">
                可以直接问：这篇笔记的核心决策是什么？它和我过往哪些长期记忆有关？
              </div>
            ) : (
              messages.map((chat) => (
                <motion.div
                  key={chat.id}
                  variants={staggerItem}
                  className={cn(
                    "rounded-[var(--radius-md)] border p-4 text-sm leading-relaxed",
                    chat.role === "assistant"
                      ? "border-[var(--hairline)] bg-[var(--material-inset)] text-[var(--text-primary)]"
                      : "border-[var(--hairline)] bg-[var(--interactive-hover)] text-[var(--text-secondary)]"
                  )}
                >
                  <div className="mb-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    {chat.role === "assistant" ? <Sparkles size={14} className="text-[var(--ai-accent)]" /> : null}
                    {chat.role === "assistant" ? "静读" : "你"}
                  </div>
                  <div className="text-sm leading-relaxed prose-a:text-[var(--primary)] prose-strong:text-[var(--text-primary)] [&_h2]:text-[15px] [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_ul]:pl-4 [&_ul]:space-y-0.5 [&_li]:leading-relaxed [&_p]:mb-2">
                    <Markdown>{chat.text || ""}</Markdown>
                  </div>
                  {chat.memoryRefs?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {chat.memoryRefs.map((ref) => (
                        <span key={ref.id} className="rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--accent-calm-soft)] px-2.5 py-1 text-xs text-[var(--accent-calm)]">
                          关联记忆 · {ref.label}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </motion.div>
              ))
            )}
          </motion.div>

          {/* v1.4 Question Input */}
          <div className="rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--material-inset)] p-2">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void ask(); } }}
              placeholder="围绕当前笔记继续思考…"
              className="min-h-[96px] w-full resize-none bg-transparent px-2 py-2 text-sm text-[var(--text-primary)] leading-relaxed outline-none placeholder:text-[var(--text-placeholder)]"
            />
            <div className="flex items-center justify-between gap-3 px-2 pt-2">
              <span className="text-xs text-[var(--text-muted)]">Enter 发送 · Shift+Enter 换行</span>
              <Button variant="primary" size="sm" loading={loading === "ask"} icon={<SendHorizonal size={14} />} onClick={() => void ask()}>
                提问
              </Button>
            </div>
          </div>

          {message && (
            <div className="rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--material-inset)] px-4 py-3 text-sm whitespace-pre-wrap text-[var(--text-muted)]">{message}</div>
          )}
        </div>
      </section>
    </div>
  );
}
