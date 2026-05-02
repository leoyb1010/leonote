"use client";

import React from "react";
import { cn } from "@/lib/utils";

type GlassLevel = "subtle" | "base" | "strong";

interface GlassSurfaceProps {
  level?: GlassLevel;
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "nav";
}

const levelStyles: Record<GlassLevel, string> = {
  subtle:
    "bg-[rgba(18,22,32,0.48)] border-[var(--border-subtle)] backdrop-blur-[8px]",
  base: "bg-[var(--surface-glass)] border-[var(--border-default)] backdrop-blur-[12px]",
  strong:
    "bg-[rgba(21,25,37,0.88)] border-[var(--border-strong)] backdrop-blur-[16px]",
};

export function GlassSurface({
  level = "base",
  children,
  className,
  as: Component = "div",
}: GlassSurfaceProps) {
  return (
    <Component
      className={cn(
        "rounded-[var(--radius-lg)] border",
        levelStyles[level],
        className
      )}
    >
      {children}
    </Component>
  );
}
