"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { memoryFactFloat } from "@/lib/animations";
import { cn } from "@/lib/utils";

type MemoryFactCardProps = {
  id: string;
  type: string;
  content: string;
  confidence: number;
  updatedAt?: string;
  highlighted?: boolean;
  className?: string;
};

export function MemoryFactCard({ id, type, content, confidence, updatedAt, highlighted = false, className }: MemoryFactCardProps) {
  const rotation = useMemo(() => {
    const seed = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return ((seed % 5) - 2) * 0.7;
  }, [id]);

  return (
    <motion.article
      layout
      variants={memoryFactFloat}
      initial="initial" animate="animate" exit="exit"
      whileHover="whileHover" whileTap="whileTap"
      style={{ rotate: rotation }}
      className={cn(
        "group relative mb-4 break-inside-avoid overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-glass)] p-4 shadow-[var(--shadow-md)] backdrop-blur-[12px]",
        highlighted && "ring-1 ring-[var(--ai-accent)]/40 shadow-[0_0_0_1px_rgba(167,139,250,0.20),0_20px_60px_rgba(167,139,250,0.10)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top_right,rgba(124,140,255,0.14),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(167,139,250,0.10),transparent_28%)]" />
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-[var(--text-muted)]">
          <span>{type}</span>
          <span>{Math.round(confidence * 100)}%</span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{content}</p>
        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <span>Memory Fact</span>
          <span>{updatedAt ? new Date(updatedAt).toLocaleDateString("zh-CN") : "长期记忆"}</span>
        </div>
      </div>
    </motion.article>
  );
}
