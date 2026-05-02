"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";

interface CardProps extends HTMLMotionProps<"div"> {
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const paddingStyles: Record<string, string> = {
  sm: "p-3 lg:p-4",
  md: "p-4 lg:p-5",
  lg: "p-5 lg:p-6",
};

export function Card({
  hover = true,
  padding = "md",
  children,
  className,
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -1 } : undefined}
      transition={{ duration: 0.12, ease: "easeOut" }}
      className={cn(
        "bg-[var(--surface-raised)] border border-[var(--border-default)] rounded-[var(--radius-lg)]",
        "transition-colors duration-[var(--motion-fast)]",
        hover && "hover:border-[var(--border-strong)]",
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-3", className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn("text-sm font-semibold text-[var(--text-primary)]", className)}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={cn("text-xs text-[var(--text-muted)] leading-relaxed", className)}>
      {children}
    </p>
  );
}
