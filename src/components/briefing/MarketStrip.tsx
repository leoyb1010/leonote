import { MarketSparkline } from "./MarketSparkline";
import type { MarketSnapshotDTO } from "@/lib/briefing/types";

function formatPrice(value: number) {
  if (value > 1000) return value.toLocaleString("zh-CN", { maximumFractionDigits: 0 });
  return value.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}

export function MarketStrip({ markets }: { markets: MarketSnapshotDTO[] }) {
  if (markets.length === 0) {
    return (
      <section className="card-premium p-4 lg:p-5">
        <p className="text-sm text-[var(--text-muted)]">市场还没醒，稍后再来看看。</p>
      </section>
    );
  }

  return (
    <section className="card-premium p-4 lg:p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {markets.slice(0, 5).map((item) => {
          const positive = item.changePct >= 0;
          return (
            <div key={item.symbol} className="rounded-[var(--radius-lg)] border border-[var(--hairline)] bg-[var(--material-inset)] px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-[var(--text-muted)]">{item.name}</p>
                  <p className="numeric-display mt-1 text-lg font-semibold text-[var(--text-primary)]">{formatPrice(item.price)}</p>
                </div>
                <MarketSparkline points={item.points} positive={positive} />
              </div>
              <p className={`numeric-display mt-2 text-xs ${positive ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                {positive ? "+" : ""}{item.changePct.toFixed(2)}%
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
