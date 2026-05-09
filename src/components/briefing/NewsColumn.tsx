import { motion } from "framer-motion";
import { NewsCard } from "./NewsCard";
import { listItemFloat } from "@/lib/animations";
import type { NewsItemDTO } from "@/lib/briefing/types";

type DetailAnchor = { top: number; left: number; width: number; height: number };

interface Props {
  title: string;
  eyebrow: string;
  items: NewsItemDTO[];
  limit?: number;
  onPatchItem: (itemId: string, patch: Partial<NewsItemDTO>) => void;
  onClick: (item: NewsItemDTO, anchor: DetailAnchor) => void;
}

export function NewsColumn({ title, eyebrow, items, limit = 10, onPatchItem, onClick }: Props) {
  const visible = items.slice(0, limit);

  return (
    <motion.div variants={listItemFloat} className="card-premium p-4 sm:p-5">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] text-[var(--text-muted)]">{eyebrow}</p>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
        </div>
        <span className="rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2.5 py-1 text-xs text-[var(--text-muted)]">
          {items.length} 条
        </span>
      </div>
      <div className="divide-y divide-[var(--hairline)]">
        {visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--text-muted)]">暂无中文资讯</p>
        ) : (
          visible.map((item) => <NewsCard key={item.id} item={item} onPatchItem={onPatchItem} onClick={onClick} />)
        )}
      </div>
    </motion.div>
  );
}
