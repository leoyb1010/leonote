"use client";

import { useState } from "react";

export function AINotePanel({ noteId }: { noteId: string }) {
  const [summary, setSummary] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("可以直接总结当前笔记，或者围绕这篇笔记提问。");
  const [loading, setLoading] = useState<"summary" | "ask" | "memory" | "">("");
  const [memories, setMemories] = useState<string[]>([]);

  const runSummary = async () => {
    setLoading("summary");
    const res = await fetch(`/api/ai/notes/${noteId}/summarize`, { method: "POST" });
    const data = await res.json();
    setLoading("");
    if (!res.ok) return setMessage(data.message || "总结失败");
    setSummary(data.summary);
    setMessage("总结已生成。\n");
  };

  const ask = async () => {
    if (!question.trim()) return setMessage("先输入问题");
    setLoading("ask");
    const res = await fetch(`/api/ai/notes/${noteId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    setLoading("");
    if (!res.ok) return setMessage(data.message || "提问失败");
    setAnswer(data.answer);
    setMessage("已完成问答。");
  };

  const extractMemory = async () => {
    setLoading("memory");
    const res = await fetch(`/api/ai/notes/${noteId}/memory`, { method: "POST" });
    const data = await res.json();
    setLoading("");
    if (!res.ok) return setMessage(data.message || "提取失败");
    setMemories(data.items || []);
    setMessage("已提取长期记忆候选，并已写入记忆库。\n");
  };

  return (
    <section className="glass-panel animate-rise space-y-4 rounded-[28px] p-5">
      <div>
        <h2 className="text-base font-medium text-[#111]">AI 助手</h2>
        <p className="mt-2 text-sm leading-6 text-[#666]">围绕当前笔记做总结、问答、长期记忆提取。</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => void runSummary()} disabled={!!loading} className="rounded-full bg-[#111] px-4 py-2 text-sm text-white">{loading === "summary" ? "生成中" : "总结这篇笔记"}</button>
        <button type="button" onClick={() => void extractMemory()} disabled={!!loading} className="rounded-full bg-[#f3f2ef] px-4 py-2 text-sm text-[#333]">{loading === "memory" ? "提取中" : "提取长期记忆"}</button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="例如：这篇笔记的核心结论是什么？" className="w-full rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm outline-none" />
        <button type="button" onClick={() => void ask()} disabled={!!loading} className="rounded-full bg-[#111] px-5 py-3 text-sm text-white">{loading === "ask" ? "回答中" : "提问"}</button>
      </div>

      {summary ? <div className="rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-[#444] whitespace-pre-wrap"><div className="mb-2 text-xs text-[#888]">AI 总结</div>{summary}</div> : null}
      {answer ? <div className="rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-[#444] whitespace-pre-wrap"><div className="mb-2 text-xs text-[#888]">AI 回答</div>{answer}</div> : null}
      {memories.length ? <div className="rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-[#444]"><div className="mb-2 text-xs text-[#888]">长期记忆候选</div><ul className="space-y-2">{memories.map((item) => <li key={item}>• {item}</li>)}</ul></div> : null}
      <div className="rounded-2xl bg-[#f7f7f5] px-4 py-3 text-sm text-[#666] whitespace-pre-wrap">{message}</div>
    </section>
  );
}
