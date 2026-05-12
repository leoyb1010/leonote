import { BookOpen, ChevronRight, Sparkles } from "lucide-react";
import { categoryLabel } from "@/lib/briefing/display";
import type { NewsItemDTO } from "@/lib/briefing/types";

interface Props {
  item: NewsItemDTO | null;
  onClick: (item: NewsItemDTO) => void;
}

export function DeepReadCard({ item, onClick }: Props) {
  return (
    <section className="card-premium p-4 lg:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase text-[var(--text-muted)]">
            <BookOpen size={13} />
            Deep read
          </div>
          <h2 className="mt-1 text-base font-semibold text-[var(--text-primary)]">深度阅读</h2>
        </div>
        {item ? (
          <span className="rounded-[var(--radius-pill)] border border-[var(--hairline)] bg-[var(--material-inset)] px-2 py-1 text-[11px] text-[var(--text-muted)]">
            {item.readingMinutes} 分钟
          </span>
        ) : null}
      </div>

      {!item ? (
        <p className="quiet-inset rounded-[var(--radius-lg)] px-3 py-8 text-center text-sm text-[var(--text-muted)]">
          等待更高质量的条目。
        </p>
      ) : (
        <button
          type="button"
          onClick={() => onClick(item)}
          className="group w-full rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] p-4 text-left transition-colors hover:border-[var(--hairline-strong)] hover:bg-[var(--interactive-hover)]"
        >
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <span>{categoryLabel(item.category)}</span>
            <span className="h-1 w-1 rounded-full bg-[var(--text-faint)]" />
            <span>{item.sourceName}</span>
          </div>
          <h3 className="mt-2 line-clamp-2 text-[15px] font-medium leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--primary)]">
            {item.title}
          </h3>
          <p className="mt-2 line-clamp-3 font-[var(--font-reading)] text-sm leading-6 text-[var(--text-secondary)]">
            {item.aiSummary || item.excerpt}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--primary-soft)] px-2 py-1 text-[11px] text-[var(--primary)]">
              <Sparkles size={12} />
              {item.aiScore == null ? "待评分" : `${Math.round(item.aiScore * 100)}`}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
              打开
              <ChevronRight size={13} />
            </span>
          </div>
        </button>
      )}
    </section>
  );
}
