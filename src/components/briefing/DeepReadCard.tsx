import { FilePlus2 } from "lucide-react";
import { proxyImageUrl } from "@/lib/briefing/utils";
import type { NewsItemDTO } from "@/lib/briefing/types";

interface Props {
  item: NewsItemDTO;
  onPatchItem: (itemId: string, patch: Partial<NewsItemDTO>) => void;
  onClick: (item: NewsItemDTO) => void;
}

export function DeepReadCard({ item, onPatchItem, onClick }: Props) {
  async function importNote(e: React.MouseEvent) {
    e.stopPropagation();
    const res = await fetch("/api/briefing/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "item", itemId: item.id }),
    });
    const json = await res.json();
    if (json.ok) onPatchItem(item.id, { isImported: true, importedNoteId: json.noteId, isRead: true });
  }

  return (
    <article
      className="card-premium overflow-hidden cursor-pointer group"
      onClick={() => onClick(item)}
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-[var(--material-inset)]">
        <img
          src={proxyImageUrl(item.imageUrl) ?? ""}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </div>
      <div className="p-5">
        <p className="numeric-display text-xs text-[var(--text-muted)]">{item.sourceName}</p>
        <h3 className="mt-2 text-lg font-semibold leading-snug tracking-[-0.035em] text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
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
        <div className="mt-4">
          <button onClick={importNote} className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors">
            <FilePlus2 size={14} /> 存为笔记
          </button>
        </div>
      </div>
    </article>
  );
}
