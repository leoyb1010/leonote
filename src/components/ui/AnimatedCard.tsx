"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { noteCardHover, springs } from "@/lib/animations";
import { clamp, cn } from "@/lib/utils";

type AnimatedCardProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  tilt?: number;
  disabled?: boolean;
};

export function AnimatedCard({ children, className, contentClassName, tilt = 10, disabled = false }: AnimatedCardProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [tilt, -tilt]), springs.gentle);
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-tilt, tilt]), springs.gentle);
  const translateY = useSpring(useTransform(pointerY, [-0.5, 0.5], [1, -6]), springs.gentle);
  const glareX = useTransform(pointerX, [-0.5, 0.5], [20, 80]);
  const glareY = useTransform(pointerY, [-0.5, 0.5], [10, 90]);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.12), transparent 24%)`;

  const reset = () => { pointerX.set(0); pointerY.set(0); };

  return (
    <motion.div
      ref={ref}
      variants={noteCardHover}
      initial="initial" animate="animate" exit="exit"
      whileHover={disabled ? undefined : "whileHover"}
      whileTap={disabled ? undefined : "whileTap"}
      style={disabled ? undefined : { rotateX, rotateY, y: translateY, transformStyle: "preserve-3d" }}
      onPointerMove={(event) => {
        if (disabled || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / rect.width, 0, 1) - 0.5;
        const y = clamp((event.clientY - rect.top) / rect.height, 0, 1) - 0.5;
        pointerX.set(x); pointerY.set(y);
      }}
      onPointerLeave={reset}
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-glass)] shadow-[var(--shadow-lg)] backdrop-blur-[12px]",
        className,
      )}
    >
      {!disabled ? (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glareBackground }}
        />
      ) : null}
      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </motion.div>
  );
}
