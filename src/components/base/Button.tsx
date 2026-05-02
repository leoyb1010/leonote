"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:bg-[var(--primary)] shadow-sm",
  secondary:
    "bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary-pressed)] active:bg-[var(--primary-soft)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--text-primary)] active:bg-[rgba(255,255,255,0.08)]",
  danger:
    "bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-[rgba(248,113,113,0.2)] active:bg-[var(--danger-soft)]",
  outline:
    "bg-transparent text-[var(--text-secondary)] border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] active:bg-[rgba(255,255,255,0.04)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
  md: "px-4 py-2 text-sm rounded-md gap-2",
  lg: "px-5 py-2.5 text-base rounded-lg gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors duration-[var(--motion-fast)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
}
