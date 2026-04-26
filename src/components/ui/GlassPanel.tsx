"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { glassPanel } from "@/lib/animations";
import { cn } from "@/lib/utils";

type BlurLevel = "sm" | "md" | "lg" | "xl";
type GlowLevel = "none" | "soft" | "brand";

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  blur?: BlurLevel;
  glow?: GlowLevel;
  borderGradient?: boolean;
  hoverGlow?: boolean;
  style?: CSSProperties;
};

const blurClassMap: Record<BlurLevel, string> = {
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-xl",
  xl: "backdrop-blur-2xl",
};

const glowClassMap: Record<GlowLevel, string> = {
  none: "shadow-[0_16px_48px_rgba(2,6,23,0.22)]",
  soft: "shadow-[0_24px_72px_rgba(2,6,23,0.30)]",
  brand: "shadow-[0_24px_72px_rgba(32,44,102,0.38),0_0_0_1px_rgba(99,102,241,0.10)]",
};

export function GlassPanel({
  children,
  className,
  contentClassName,
  blur = "lg",
  glow = "soft",
  borderGradient = true,
  hoverGlow = false,
  style,
}: GlassPanelProps) {
  return (
    <motion.div
      variants={glassPanel}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={hoverGlow ? "whileHover" : undefined}
      whileTap="whileTap"
      style={style}
      className={cn(
        "group relative overflow-hidden rounded-[24px] bg-[rgba(16,19,26,0.72)] text-white/92",
        blurClassMap[blur],
        glowClassMap[glow],
        className,
      )}
    >
      {borderGradient ? (
        <div className="pointer-events-none absolute inset-0 rounded-[24px] p-px [background:linear-gradient(160deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06)_32%,rgba(99,102,241,0.18)_66%,rgba(34,211,238,0.10)_100%)]">
          <div className="h-full w-full rounded-[23px] bg-[rgba(16,19,26,0.72)]/95" />
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_38%)] opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
      {hoverGlow ? (
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 [background:radial-gradient(circle_at_var(--pointer-x,50%)_var(--pointer-y,0%),rgba(99,102,241,0.22),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.14),transparent_24%)]" />
      ) : null}

      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </motion.div>
  );
}
