"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExpenseCategoryDTO } from "./types";

type Props = {
  categories: ExpenseCategoryDTO[];
  selectedId?: string | null;
  onSelect?: (categoryId: string | null) => void;
  showCreateLink?: boolean;
};

export function CategoryPills({ categories, selectedId, onSelect, showCreateLink = true }: Props) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      <button
        type="button"
        onClick={() => onSelect?.(null)}
        className={cn(
          "min-h-[44px] shrink-0 rounded-full border px-3.5 text-sm transition-colors",
          selectedId === null || selectedId === undefined
            ? "border-[var(--hairline-strong)] bg-[var(--interactive-selected)] text-[var(--text-primary)]"
            : "border-[var(--hairline)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--interactive-hover)]",
        )}
      >
        不分类
      </button>

      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect?.(category.id)}
          className={cn(
            "min-h-[44px] shrink-0 rounded-full border px-3.5 text-sm transition-colors",
            selectedId === category.id
              ? "border-[var(--hairline-strong)] bg-[var(--interactive-selected)] text-[var(--text-primary)]"
              : "border-[var(--hairline)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--interactive-hover)]",
          )}
          aria-label={`选择 ${category.name}`}
        >
          <span className="mr-1.5" aria-hidden>{category.emoji}</span>
          {category.name}
        </button>
      ))}

      {showCreateLink ? (
        <Link
          href="/ledger/categories"
          className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border border-dashed border-[var(--hairline)] px-3.5 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--interactive-hover)] hover:text-[var(--text-primary)]"
        >
          <Plus size={14} /> 新类型
        </Link>
      ) : null}
    </div>
  );
}
