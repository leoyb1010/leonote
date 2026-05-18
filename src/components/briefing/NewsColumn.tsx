import { motion } from "framer-motion";
import { Newspaper } from "lucide-react";
import { NewsCard } from "./NewsCard";
import { listItemFloat } from "@/lib/animations";
import type { NewsItemDTO } from "@/lib/briefing/types";

type DetailAnchor = { top: number; left: number; width: number; height: number };

interface Props {
  title: string;
  eyebrow: string;
  items: NewsItemDTO[];
  limit?: number;
  featured?: boolean;
  dense?: boolean;
  sectionId?: string;
  emptyText?: string;
  onPatchItem: (itemId: string, patch: Partial<NewsItemDTO>) => void;
  onClick: (item: NewsItemDTO, anchor: DetailAnchor) => void;
}

export function NewsColumn({
  title,
  eyebrow,
  items,
  limit = 10,
  featured = false,
  dense = false,
  sectionId,
  emptyText = "暂无可展示资讯",
  onPatchItem,
  onClick,
}: Props) {
  const visible = items.slice(0, limit);

  return (
    <motion.section id={sectionId} variants={listItemFloat} className="scroll-mt-20 space-y-3">
      <div className="flex items-end justify-between gap-4 border-b border-[var(--hairline)] pb-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase text-[var(--text-muted)]">{eyebrow}</p>
          <h2 className="mt-1 text-[1.05rem] font-semibold text-[var(--text-primary)]">{title}</h2>
        </div>
        <span className="rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
          {items.length} 条
        </span>
      </div>

      {visible.length === 0 ? (
        <div className={`${featured ? "min-h-[120px]" : "min-h-[140px] sm:min-h-[160px]"} quiet-inset flex flex-col items-center justify-center rounded-[var(--radius-xl)] px-4 py-8 text-center`}>
          <Newspaper size={22} className="text-[var(--text-faint)]" />
          <p className="mt-3 text-sm text-[var(--text-muted)]">{emptyText}</p>
        </div>
      ) : (
        <div className={featured ? "grid gap-3 sm:grid-cols-2 2xl:grid-cols-2" : dense ? "grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2" : "grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"}>
          {visible.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              featured={featured}
              dense={dense}
              onPatchItem={onPatchItem}
              onClick={onClick}
            />
          ))}
        </div>
      )}
    </motion.section>
  );
}
