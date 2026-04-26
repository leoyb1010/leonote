"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BrainCircuit, SendHorizonal, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AISpark } from "@/components/ui/AISpark";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { aiMessageAppear, staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";

type MemoryItem = {
  id: string;
  type?: string;
  label: string;
  content?: string;
  confidence?: number;
};

type MemoryRef = {
  id: string;
  label: string;
  reason?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  memoryRefs?: MemoryRef[];
};

type AskResponse = {
  answer?: string;
  memoryRefs?: Array<{ id: string; type?: string; content?: string; confidence?: number; reason?: string }>;
  message?: string;
};

type AIChatPanelProps = {
  noteId: string;
  linkedMemories?: Array<{ id: string; label: string; content?: string }>;
};

export function AIChatPanel({ noteId, linkedMemories = [] }: AIChatPanelProps) {
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(440);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState<"summary" | "ask" | "memory" | "">("");
  const [message, setMessage] = useState("可以直接总结当前笔记，或者围绕这篇笔记提问。\n如果命中了长期记忆，我会把关联事实高亮出来。");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const [summaryCard, setSummaryCard] = useState("");
  const [memories, setMemories] = useState<MemoryItem[]>(
    linkedMemories.map((item) => ({ id: item.id, label: item.label, content: item.content })),
  );

  const memoryMap = useMemo(() => new Map(memories.map((item) => [item.id, item])), [memories]);

  useEffect(() => {
    if (linkedMemories.length) return;
    let active = true;
    fetch("/api/ai/memories", { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!active || !ok) return;
        setMemories((data.items || []).map((item: { id: string; type: string; content: string; confidence: number }) => ({
          id: item.id,
          type: item.type,
          label: item.type,
          content: item.content,
          confidence: item.confidence,
        })));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [linkedMemories]);

  useEffect(() => {
    if (!highlightedIds.length) return;
    const timer = window.setTimeout(() => setHighlightedIds([]), 2200);
    return () => window.clearTimeout(timer);
  }, [highlightedIds]);

  const typeAppend = async (text: string, refs?: MemoryRef[]) => {
    const id = `assistant-${Date.now()}`;
    if (reduceMotion) {
      setMessages((items) => [...items, { id, role: "assistant", text, memoryRefs: refs }]);
      return;
    }
    let draft = "";
    setMessages((items) => [...items, { id, role: "assistant", text: "", memoryRefs: refs }]);
    for (let index = 0; index < text.length; index += 5) {
      const chunk = text.slice(index, index + 5);
      draft += chunk;
      await new Promise<void>((resolve) => {
        window.setTimeout(() => {
          setMessages((items) => items.map((item) => (item.id === id ? { ...item, text: draft } : item)));
          resolve();
        }, 24);
      });
    }
  };

  const runSummary = async () => {
    setLoading("summary");
    const res = await fetch(`/api/ai/notes/${noteId}/summarize`, { method: "POST" });
    const data = await res.json().catch(() => ({ summary: "" }));
    setLoading("");
    if (!res.ok) return setMessage(data.message || "总结失败");
    setSummaryCard(data.summary || "总结已生成，但内容为空。");
    setMessage("总结已生成，并已推送到顶部卡片。\n你也可以继续追问这篇笔记。");
  };

  const ask = async () => {
    if (!question.trim()) return setMessage("先输入问题");
    const currentQuestion = question.trim();
    setQuestion("");
    setMessages((items) => [...items, { id: `user-${Date.now()}`, role: "user", text: currentQuestion }]);
    setLoading("ask");

    const res = await fetch(`/api/ai/notes/${noteId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: currentQuestion }),
    });
    const data = (await res.json().catch(() => ({ answer: "" }))) as AskResponse;
    setLoading("");
    if (!res.ok) return setMessage(data.message || "提问失败");

    const refs = (data.memoryRefs || []).map((item) => ({
      id: item.id,
      label: memoryMap.get(item.id)?.label || item.type || "Memory",
      reason: item.reason,
    }));

    if (refs.length) {
      setHighlightedIds(refs.map((item) => item.id));
    }

    await typeAppend(data.answer || "已完成回答。", refs.length ? refs : undefined);
    setMessage(refs.length ? "已完成问答。命中的长期记忆已同步高亮。" : "已完成问答。当前没有命中可用长期记忆。");
  };

  const extractMemory = async () => {
    setLoading("memory");
    const res = await fetch(`/api/ai/notes/${noteId}/memory`, { method: "POST" });
    const data = await res.json().catch(() => ({ items: [] as string[] }));
    setLoading("");
    if (!res.ok) return setMessage(data.message || "提取失败");
    setMessage(`已提取 ${data.items?.length ?? 0} 条长期记忆候选，并写入记忆库。`);
    const memoriesRes = await fetch("/api/ai/memories", { cache: "no-store" });
    const memoriesData = await memoriesRes.json().catch(() => ({ items: [] as MemoryItem[] }));
    if (memoriesRes.ok) {
      setMemories((memoriesData.items || []).map((item: { id: string; type: string; content: string; confidence: number }) => ({
        id: item.id,
        type: item.type,
        label: item.type,
        content: item.content,
        confidence: item.confidence,
      })));
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,var(--chat-width))]" style={{ ["--chat-width" as string]: `${width}px` }}>
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {summaryCard ? (
            <motion.div layout initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <GlassPanel blur="lg" glow="brand" className="rounded-[24px] p-4">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-cyan-200/72"><Wand2 className="h-3.5 w-3.5" /> AI Summary</div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-white/78">{summaryCard}</p>
              </GlassPanel>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="columns-1 gap-4 md:columns-2">
          {memories.map((memory) => (
            <motion.div key={memory.id} layout className="relative mb-4 break-inside-avoid">
              <div className={cn("absolute right-full top-1/2 hidden h-px w-10 -translate-y-1/2 bg-gradient-to-r from-cyan-300/60 to-transparent xl:block", highlightedIds.includes(memory.id) && "animate-[pulse_900ms_ease-in-out_2]")} />
              <GlassPanel
                blur="lg"
                glow={highlightedIds.includes(memory.id) ? "brand" : "soft"}
                className={cn("rounded-[22px] p-4 transition duration-300", highlightedIds.includes(memory.id) && "ring-1 ring-cyan-300/40")}
              >
                <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.22em] text-white/45">
                  <span>{memory.type || "Memory"}</span>
                  <BrainCircuit className="h-3.5 w-3.5 text-cyan-300" />
                </div>
                <h4 className="mt-3 text-sm font-medium text-white">{memory.label}</h4>
                {memory.content ? <p className="mt-2 text-sm leading-6 text-white/62">{memory.content}</p> : null}
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.aside drag="x" dragConstraints={{ left: -220, right: 180 }} dragElastic={0.06} onDragEnd={(_, info) => setWidth((value) => Math.max(340, Math.min(720, value + info.offset.x)))} className="relative">
        <GlassPanel blur="xl" glow="brand" hoverGlow className="relative overflow-hidden rounded-[28px] p-5">
          <AISpark density={10} subdued className="opacity-80" />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/45">AI Drawer</div>
              <h3 className="mt-2 text-lg font-semibold text-white">围绕当前笔记思考</h3>
            </div>
            <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/56">可拖拽宽度</div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => void runSummary()} disabled={!!loading} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:brightness-110 disabled:opacity-60">{loading === "summary" ? "生成中" : "总结这篇笔记"}</button>
            <button type="button" onClick={() => void extractMemory()} disabled={!!loading} className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/78 transition hover:bg-white/10 disabled:opacity-60">{loading === "memory" ? "提取中" : "提取长期记忆"}</button>
          </div>

          <motion.div variants={staggerContainer} initial="initial" animate="animate" className="mt-5 space-y-3">
            {messages.length === 0 ? (
              <div className="rounded-[22px] border border-white/8 bg-white/5 px-4 py-4 text-sm leading-7 text-white/58">可以直接问：这篇笔记的核心决策是什么？它和我过往哪些长期记忆冲突或一致？</div>
            ) : (
              messages.map((chat) => (
                <motion.div key={chat.id} variants={staggerItem}>
                  <motion.div
                    variants={aiMessageAppear}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    whileHover="whileHover"
                    whileTap="whileTap"
                    className={cn(
                      "rounded-[22px] border p-4 text-sm leading-7",
                      chat.role === "assistant"
                        ? "border-indigo-300/16 bg-[linear-gradient(180deg,rgba(23,29,43,0.94),rgba(17,22,31,0.94))] text-white shadow-[0_18px_54px_rgba(18,24,46,0.30)]"
                        : "border-white/8 bg-white/6 text-white/78",
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/42">
                      {chat.role === "assistant" ? <Sparkles className="h-3.5 w-3.5 text-cyan-300" /> : null}
                      {chat.role === "assistant" ? "Leonote AI" : "You"}
                    </div>
                    <p className="whitespace-pre-wrap">{chat.text || (chat.role === "assistant" ? "思考中…" : "")}</p>
                    {chat.memoryRefs?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {chat.memoryRefs.map((ref) => (
                          <span key={ref.id} className="rounded-full border border-cyan-300/16 bg-cyan-300/10 px-2.5 py-1 text-xs text-cyan-100">
                            关联记忆 · {memoryMap.get(ref.id)?.content?.slice(0, 18) || ref.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </motion.div>
                </motion.div>
              ))
            )}
          </motion.div>

          <div className="mt-5 overflow-hidden rounded-[22px] border border-white/10 bg-[rgba(8,11,18,0.76)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="rounded-[18px] bg-[rgba(8,11,18,0.88)] px-3 py-3 [background-image:linear-gradient(180deg,rgba(255,255,255,0.02),transparent),linear-gradient(0deg,rgba(34,211,238,0.00),rgba(99,102,241,0.00))] focus-within:[background-image:linear-gradient(180deg,rgba(255,255,255,0.02),transparent),linear-gradient(0deg,rgba(34,211,238,0.16),rgba(99,102,241,0.00))] transition duration-500">
              <textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="围绕当前笔记继续追问…" className="min-h-[96px] w-full resize-none bg-transparent text-sm leading-7 text-white/82 outline-none placeholder:text-white/26" />
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-xs text-white/42">输入框聚焦时会出现柔和光流，避免抢占阅读。</div>
                <button type="button" onClick={() => void ask()} disabled={!!loading} className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,rgba(99,102,241,0.96),rgba(124,58,237,0.94),rgba(34,211,238,0.90))] px-4 py-2 text-sm text-white shadow-[0_14px_32px_rgba(79,70,229,0.28)] transition hover:brightness-110 disabled:opacity-60">
                  <SendHorizonal className="h-4 w-4" />
                  {loading === "ask" ? "回答中" : "提问"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[20px] border border-white/8 bg-white/5 px-4 py-3 text-sm whitespace-pre-wrap text-white/60">{message}</div>
        </GlassPanel>
      </motion.aside>
    </div>
  );
}
