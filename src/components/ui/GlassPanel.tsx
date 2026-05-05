"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BlurLevel = "sm" | "md" | "lg" | "xl";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  blur?: BlurLevel;
};

const blurMap: Record<BlurLevel, string> = {
  sm: "backdrop-blur-[4px]",
  md: "backdrop-blur-[8px]",
  lg: "backdrop-blur-[12px]",
  xl: "backdrop-blur-[16px]",
};

export function GlassPanel({
  children,
  className,
  contentClassName,
  blur = "lg",
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)]",
        "bg-[var(--surface-glass)]",
        blurMap[blur],
        className
      )}
    >
      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </div>
  );
}
