"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, FolderKanban, Sparkles, Settings, Sun, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const allCommands: CommandItem[] = [
    { id: "new-note", label: "新建笔记", description: "创建一篇新笔记", icon: <Plus size={16} />, action: () => router.push("/notes/new"), shortcut: "⌘N" },
    { id: "today", label: "今天", description: "查看今日回顾", icon: <Sun size={16} />, action: () => router.push("/") },
    { id: "notes", label: "所有笔记", description: "浏览全部笔记", icon: <FileText size={16} />, action: () => router.push("/notes") },
    { id: "projects", label: "项目", description: "管理项目看板", icon: <FolderKanban size={16} />, action: () => router.push("/projects") },
    { id: "ai", label: "AI 问答", description: "向 AI 提问", icon: <Sparkles size={16} />, action: () => router.push("/ai") },
    { id: "search", label: "搜索笔记", description: "全文搜索", icon: <Search size={16} />, action: () => router.push("/search") },
    { id: "settings", label: "设置", description: "AI 配置、导入导出", icon: <Settings size={16} />, action: () => router.push("/settings") },
  ];

  const filtered = query
    ? allCommands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()) || (c.description ?? "").toLowerCase().includes(query.toLowerCase()))
    : allCommands;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((prev) => (prev + 1) % filtered.length); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length); }
      else if (e.key === "Enter") { e.preventDefault(); const cmd = filtered[selectedIndex]; if (cmd) { cmd.action(); setOpen(false); } }
      else if (e.key === "Escape") { setOpen(false); }
    },
    [filtered, selectedIndex]
  );

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="relative w-full max-w-md mx-4 bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-default)]">
              <Search size={16} className="text-[var(--text-muted)] shrink-0" />
              <input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }} onKeyDown={handleKeyDown} placeholder="输入命令或搜索..." className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)] outline-none" />
              <kbd className="text-[10px] text-[var(--text-muted)] bg-[var(--primary-soft)] px-1.5 py-0.5 rounded font-mono">ESC</kbd>
            </div>
            <div className="max-h-[320px] overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">没有找到匹配的命令</div>
              ) : (
                filtered.map((cmd, idx) => (
                  <button key={cmd.id} onClick={() => { cmd.action(); setOpen(false); }} onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${idx === selectedIndex ? "bg-[rgba(255,255,255,0.06)] text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)]"}`}
                  >
                    <span className="shrink-0">{cmd.icon}</span>
                    <div className="flex-1 min-w-0"><div className="text-sm font-medium">{cmd.label}</div>{cmd.description && <div className="text-xs text-[var(--text-muted)]">{cmd.description}</div>}</div>
                    {cmd.shortcut && <kbd className="text-[10px] text-[var(--text-muted)] font-mono">{cmd.shortcut}</kbd>}
                  </button>
                ))
              )}
            </div>
            <div className="flex items-center gap-4 px-4 py-2 text-[10px] text-[var(--text-muted)] border-t border-[var(--border-default)]">
              <span><kbd className="font-mono">↑↓</kbd> 导航</span>
              <span><kbd className="font-mono">↵</kbd> 选择</span>
              <span><kbd className="font-mono">Esc</kbd> 关闭</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
