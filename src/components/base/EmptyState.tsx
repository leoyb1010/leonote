"use client";

import React from "react";
import { cn } from "@/lib/utils";

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
        <>
          {action.href ? (
            <a
              href={action.href}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--text-primary)] hover:bg-[var(--primary-hover)] transition-colors"
            >
              {action.label}
            </a>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-[var(--primary)] text-[var(--text-primary)] hover:bg-[var(--primary-hover)] transition-colors"
            >
              {action.label}
            </button>
          )}
        </>
      )}
    </div>
  );
}
