"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BriefingHero } from "./BriefingHero";
import { TopBar } from "./TopBar";
import { BriefingFilters } from "./BriefingFilters";
import { NewsColumn } from "./NewsColumn";
import { NewsDetailModal } from "./NewsDetailModal";
import { listStagger } from "@/lib/animations";
import type { BriefingCategory, BriefingDigestSummary, BriefingRange, MarketSnapshotDTO, NewsItemDTO, WeatherDTO } from "@/lib/briefing/types";

type CategoryFilter = BriefingCategory | "all";

interface Props {
  initialDigest: BriefingDigestSummary | null;
  initialItems: NewsItemDTO[];
  initialMarkets: MarketSnapshotDTO[];
  initialWeather: WeatherDTO | null;
}

export function BriefingShell({ initialDigest, initialItems, initialMarkets, initialWeather }: Props) {
  const [items, setItems] = useState(initialItems);
  const [range, setRange] = useState<BriefingRange>("today");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [selectedItem, setSelectedItem] = useState<NewsItemDTO | null>(null);

  const dateLabel = useMemo(() => {
    const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const now = new Date();
    return `${weekdays[now.getDay()]} · ${now.getMonth() + 1}月${now.getDate()}日`;
  }, []);

  const visibleItems = useMemo(() => {
    return [...items]
      .filter((item) => category === "all" || item.category === category)
      .sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));
  }, [items, category]);

  const grouped = {
    world: visibleItems.filter((item) => item.category === "world").slice(0, 6),
    finance: visibleItems.filter((item) => item.category === "finance").slice(0, 6),
    ai_tech: visibleItems.filter((item) => item.category === "ai_tech").slice(0, 6),
  };

  async function refresh(nextRange = range, nextCategory = category) {
    const res = await fetch(`/api/briefing/digest?range=${nextRange}&category=${nextCategory}`);
    const json = await res.json();
    if (json.ok) setItems(json.items);
  }

  function patchItem(itemId: string, patch: Partial<Pick<NewsItemDTO, "isRead" | "isFavorited" | "isImported" | "importedNoteId">>) {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item)));
  }

  return (
    <main className="mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8">
      {/* Hero */}
      <BriefingHero digest={initialDigest} onImported={(noteId) => console.log("digest imported", noteId)} />

      {/* Top Bar: Markets + Weather */}
      <div className="mt-4">
        <TopBar markets={initialMarkets} weather={initialWeather} dateLabel={dateLabel} />
      </div>

      {/* Filters */}
      <div className="mt-5">
        <BriefingFilters
          range={range}
          category={category}
          onRangeChange={(next) => {
            setRange(next);
            refresh(next, category);
          }}
          onCategoryChange={(next) => {
            setCategory(next);
            refresh(range, next);
          }}
        />
      </div>

      {/* News Columns */}
      <motion.section variants={listStagger} initial="initial" animate="animate" className="mt-4 grid gap-4 lg:grid-cols-3">
        <NewsColumn title="世界" eyebrow="国际要闻" items={grouped.world} onPatchItem={patchItem} onClick={setSelectedItem} />
        <NewsColumn title="金融" eyebrow="市场财经" items={grouped.finance} onPatchItem={patchItem} onClick={setSelectedItem} />
        <NewsColumn title="AI 科技" eyebrow="人工智能" items={grouped.ai_tech} onPatchItem={patchItem} onClick={setSelectedItem} />
      </motion.section>

      {/* News Detail Modal */}
      {selectedItem && (
        <NewsDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onPatchItem={patchItem}
        />
      )}
    </main>
  );
}
