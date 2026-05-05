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
  asChild?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:bg-[var(--primary)]",
  secondary:
    "bg-transparent text-[var(--text-secondary)] border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] active:bg-[rgba(255,255,255,0.04)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-primary)] active:bg-[rgba(255,255,255,0.06)]",
  danger:
    "bg-transparent text-[var(--danger)] hover:bg-[var(--danger-soft)] active:bg-[rgba(242,109,109,0.16)]",
  outline:
    "bg-transparent text-[var(--text-secondary)] border border-[var(--border-default)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] active:bg-[rgba(255,255,255,0.04)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-7 px-3 text-xs rounded-md gap-1.5",
  md: "h-8 px-4 text-sm rounded-md gap-1.5",
  lg: "h-10 px-5 text-sm rounded-md gap-2",
};

export function buttonClass(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cn(
    "inline-flex items-center justify-center font-medium transition-[background-color,border-color,color,opacity] duration-[var(--duration-quick)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
    variantStyles[variant],
    sizeStyles[size],
    className
  );
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  asChild = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const classes = buttonClass(variant, size, className);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
      className: cn(classes, (children.props as { className?: string }).className),
    });
  }

  return (
    <motion.button
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.1, ease: [0.2, 0, 0, 1] }}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
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
