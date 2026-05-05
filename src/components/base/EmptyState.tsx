"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button, buttonClass } from "@/components/base/Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        "animate-slide-up",
        className
      )}
    >
      {icon && (
        <div className="mb-5 text-[var(--text-muted)] opacity-60">
          {icon}
        </div>
      )}
      <h3 className="text-md font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed mb-6">
        {description}
      </p>
      {action && (
        action.href ? (
          <a href={action.href} className={buttonClass("primary", "md")}>{action.label}</a>
        ) : (
          <Button size="md" onClick={action.onClick}>{action.label}</Button>
        )
      )}
    </div>
  );
}
