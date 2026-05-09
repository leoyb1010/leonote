import type { BriefingCategory, BriefingRange } from "@/lib/briefing/types";
import { cn } from "@/lib/utils";

type Category = BriefingCategory | "all";

interface Props {
  range: BriefingRange;
  category: Category;
  onRangeChange: (range: BriefingRange) => void;
  onCategoryChange: (category: Category) => void;
}

const ranges: Array<{ value: BriefingRange; label: string }> = [
  { value: "today", label: "今日" },
  { value: "week", label: "本周" },
  { value: "favorites", label: "收藏" },
];

const categories: Array<{ value: Category; label: string }> = [
  { value: "all", label: "全部" },
  { value: "world", label: "世界" },
  { value: "finance", label: "金融" },
  { value: "ai_tech", label: "人工智能" },
  { value: "social_x", label: "X 监控" },
];

export function BriefingFilters({ range, category, onRangeChange, onCategoryChange }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="inline-flex w-fit rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] p-1">
        {ranges.map((item) => (
          <button
            key={item.value}
            onClick={() => onRangeChange(item.value)}
            className={cn(
              "rounded-[var(--radius-pill)] px-3 py-1.5 text-xs transition-colors",
              range === item.value ? "bg-[var(--interactive-selected)] text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item.value}
            onClick={() => onCategoryChange(item.value)}
            className={cn(
              "rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs transition-colors",
              category === item.value
                ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                : "border-[var(--hairline)] text-[var(--text-muted)] hover:bg-[var(--interactive-hover)] hover:text-[var(--text-secondary)]",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
