"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type SaveStatus = "saved" | "saving" | "offline" | "idle";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  className?: string;
}

const statusConfig: Record<SaveStatus, { label: string; color: string; dot: string }> = {
  saved: { label: "已保存", color: "text-[var(--success)]", dot: "bg-[var(--success)]" },
  saving: { label: "保存中", color: "text-[var(--text-muted)]", dot: "bg-[var(--text-muted)]" },
  offline: { label: "离线", color: "text-[var(--warning)]", dot: "bg-[var(--warning)]" },
  idle: { label: "", color: "text-[var(--text-muted)]", dot: "bg-transparent" },
};

export function SaveStatusIndicator({ status, className }: SaveStatusIndicatorProps) {
  const cfg = statusConfig[status];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
        className={cn("flex items-center gap-1.5 text-xs", cfg.color, className)}
      >
        <motion.span
          animate={status === "saving" ? { opacity: [1, 0.4, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
          className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)}
        />
        {cfg.label}
      </motion.div>
    </AnimatePresence>
  );
}
