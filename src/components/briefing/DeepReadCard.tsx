import type { NewsItemDTO } from "@/lib/briefing/types";

interface Props {
  item: NewsItemDTO;
  onClick: (item: NewsItemDTO) => void;
}

export function DeepReadCard({ item, onClick }: Props) {
  return (
    <article
      className="card-premium overflow-hidden cursor-pointer group"
      onClick={() => onClick(item)}
    >
      <div className="p-5">
        <p className="text-xs text-[var(--text-muted)]">{item.sourceName}</p>
        <h3 className="mt-2 text-lg font-semibold leading-snug text-[var(--text-primary)] transition-colors group-hover:text-[var(--primary)]">
          {item.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-3">
          {item.aiSummary || item.excerpt}
        </p>
        {item.aiKeyPoints.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
            {item.aiKeyPoints.slice(0, 3).map((point, i) => <li key={i} className="flex gap-2"><span className="text-[var(--primary)] shrink-0">·</span> {point}</li>)}
          </ul>
        )}
      </div>
    </article>
  );
}
