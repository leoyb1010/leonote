"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BrainCircuit, SendHorizonal, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/base/Button";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";

type MemoryItem = { id: string; type?: string; label: string; content?: string; confidence?: number };
type MemoryRef = { id: string; label: string; reason?: string };
type ChatMessage = { id: string; role: "user" | "assistant"; text: string; memoryRefs?: MemoryRef[] };

export function AIChatPanel({ noteId, linkedMemories = [] }: { noteId: string; linkedMemories?: Array<{ id: string; label: string; content?: string }> }) {
  const reduceMotion = useReducedMotion();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState<"summary" | "ask" | "memory" | "">("");
  const [message, setMessage] = useState("可以直接总结当前笔记，或者围绕这篇笔记提问。\n如果命中了长期记忆，我会把关联事实高亮出来。");
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
    try {
      const data = await callAi("summarize");
      setSummaryCard(data.summary || data.content || "未返回总结");
      setMessage("总结已生成");
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
    try { await callAi("memory"); setMessage("长期记忆已提取"); }
    catch (e: unknown) { setMessage((e as Error).message); }
    setLoading("");
  };

  return (
    <div className="space-y-4">
      {summaryCard && (
        <GlassPanel blur="lg" className="rounded-[var(--radius-lg)] p-5">
          <div className="text-xs text-[var(--ai-accent)] font-medium uppercase mb-2">AI Summary</div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{summaryCard}</p>
        </GlassPanel>
      )}

      <GlassPanel blur="xl" className="relative overflow-hidden rounded-[var(--radius-xl)] p-5">
        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-[var(--text-muted)]">AI Drawer</div>
              <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">围绕当前笔记思考</h3>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" loading={loading === "summary"} icon={<Wand2 size={14} />} onClick={() => void runSummary()}>总结这篇笔记</Button>
            <Button variant="secondary" size="sm" loading={loading === "memory"} icon={<BrainCircuit size={14} />} onClick={() => void extractMemory()}>提取长期记忆</Button>
          </div>

          {memories.length > 0 && (
            <div className="columns-1 gap-3 md:columns-2">
              {memories.map((mem) => (
                <GlassPanel key={mem.id} blur="lg" className={cn("rounded-[var(--radius-md)] p-4 mb-3 break-inside-avoid", highlightedIds.includes(mem.id) && "ring-1 ring-[var(--ai-accent)]/40")}>
                  <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    <span>{mem.type || "Memory"}</span>
                    <BrainCircuit size={14} className="text-[var(--ai-accent)]" />
                  </div>
                  <h4 className="mt-2 text-sm font-medium text-[var(--text-primary)]">{mem.label}</h4>
                  {mem.content && <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">{mem.content}</p>}
                </GlassPanel>
              ))}
            </div>
          )}

          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
            {messages.length === 0 ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[rgba(255,255,255,0.04)] px-4 py-4 text-sm text-[var(--text-muted)] leading-relaxed">
                可以直接问：这篇笔记的核心决策是什么？它和我过往哪些长期记忆冲突或一致？
              </div>
            ) : (
              messages.map((chat) => (
                <motion.div key={chat.id} variants={staggerItem} className={cn("rounded-[var(--radius-md)] border p-4 text-sm leading-relaxed",
                  chat.role === "assistant" ? "border-[var(--ai-soft)] bg-[var(--surface-raised)] text-[var(--text-primary)]" : "border-[var(--border-default)] bg-[rgba(255,255,255,0.04)] text-[var(--text-secondary)]")}>
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    {chat.role === "assistant" ? <Sparkles size={14} className="text-[var(--ai-accent)]" /> : null}
                    {chat.role === "assistant" ? "Leonote AI" : "You"}
                  </div>
                  <p className="whitespace-pre-wrap">{chat.text || (chat.role === "assistant" ? "思考中…" : "")}</p>
                  {chat.memoryRefs?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {chat.memoryRefs.map((ref) => (
                        <span key={ref.id} className="rounded-[var(--radius-pill)] border border-[var(--ai-soft)] bg-[var(--ai-soft)] px-2.5 py-1 text-xs text-[var(--ai-accent)]">关联记忆 · {ref.label}</span>
                      ))}
                    </div>
                  ) : null}
                </motion.div>
              ))
            )}
          </motion.div>

          <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-base)] p-2">
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void ask(); } }} placeholder="围绕当前笔记继续追问…" className="min-h-[96px] w-full resize-none bg-transparent px-2 py-2 text-sm text-[var(--text-primary)] leading-relaxed outline-none placeholder:text-[var(--text-placeholder)]" />
            <div className="flex items-center justify-between gap-3 px-2 pt-2">
              <span className="text-xs text-[var(--text-muted)]">按 Enter 发送，Shift+Enter 换行</span>
              <Button variant="primary" size="sm" loading={loading === "ask"} icon={<SendHorizonal size={14} />} onClick={() => void ask()}>提问</Button>
            </div>
          </div>

          {message && (
            <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-sm whitespace-pre-wrap text-[var(--text-muted)]">{message}</div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
