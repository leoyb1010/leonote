"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
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
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-2)]",
        "transition-[border-color,background-color] duration-[var(--duration-quick)]",
        hover && "hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)]",
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
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
