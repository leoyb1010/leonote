"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type BlurLevel = "sm" | "md" | "lg" | "xl";
type GlowLevel = "none" | "soft" | "brand";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  blur?: BlurLevel;
  glow?: GlowLevel;
  hoverGlow?: boolean;
  style?: CSSProperties;
};

const blurMap: Record<BlurLevel, string> = {
  sm: "backdrop-blur-[4px]",
  md: "backdrop-blur-[8px]",
  lg: "backdrop-blur-[12px]",
  xl: "backdrop-blur-[16px]",
};

const glowMap: Record<GlowLevel, string> = {
  none: "shadow-[var(--shadow-sm)]",
  soft: "shadow-[var(--shadow-md)]",
  brand: "shadow-[var(--shadow-glow)]",
};

export function GlassPanel({
  children,
  className,
  contentClassName,
  blur = "lg",
  glow = "soft",
  hoverGlow = false,
  style,
}: GlassPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={hoverGlow ? { borderColor: "rgba(255,255,255,0.14)" } : undefined}
      style={style}
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)]",
        "bg-[var(--surface-glass)]",
        blurMap[blur],
        glowMap[glow],
        "transition-colors duration-[var(--motion-fast)]",
        hoverGlow && "hover:border-[var(--border-strong)]",
        className
      )}
    >
      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </motion.div>
  );
}
