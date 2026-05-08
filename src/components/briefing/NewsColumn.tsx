import { motion } from "framer-motion";
import { NewsCard } from "./NewsCard";
import { listItemFloat } from "@/lib/animations";
import type { NewsItemDTO } from "@/lib/briefing/types";

interface Props {
  title: string;
  eyebrow: string;
  items: NewsItemDTO[];
  onPatchItem: (itemId: string, patch: Partial<NewsItemDTO>) => void;
  onClick: (item: NewsItemDTO) => void;
}

export function NewsColumn({ title, eyebrow, items, onPatchItem, onClick }: Props) {
  return (
    <motion.div variants={listItemFloat} className="card-premium p-4">
      <div className="mb-1 flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{eyebrow}</p>
          <h2 className="text-[15px] font-semibold tracking-[-0.03em] text-[var(--text-primary)]">{title}</h2>
        </div>
      </div>
      <div className="divide-y divide-[var(--hairline)]">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--text-muted)]">暂无资讯</p>
        ) : (
          items.map((item) => <NewsCard key={item.id} item={item} onPatchItem={onPatchItem} onClick={onClick} />)
        )}
      </div>
    </motion.div>
  );
}
