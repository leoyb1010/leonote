"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { BriefingHero } from "./BriefingHero";
import { TopBar } from "./TopBar";
import { BriefingFilters } from "./BriefingFilters";
import { NewsColumn } from "./NewsColumn";
import { NewsDetailModal } from "./NewsDetailModal";
import { listStagger } from "@/lib/animations";
import { categoryLabel } from "@/lib/briefing/display";
import type { BriefingCategory, BriefingDigestSummary, BriefingRange, MarketSnapshotDTO, NewsItemDTO, WeatherDTO } from "@/lib/briefing/types";

type CategoryFilter = BriefingCategory | "all";
type DetailAnchor = { top: number; left: number; width: number; height: number };
type SelectedDetail = { item: NewsItemDTO; anchor: DetailAnchor };

interface Props {
  initialDigest: BriefingDigestSummary | null;
  initialItems: NewsItemDTO[];
  initialMarkets: MarketSnapshotDTO[];
  initialWeather: WeatherDTO | null;
}

export function BriefingShell({ initialDigest, initialItems, initialMarkets, initialWeather }: Props) {
  const [items, setItems] = useState(initialItems);
  const [digest, setDigest] = useState(initialDigest);
  const [markets, setMarkets] = useState(initialMarkets);
  const [weather, setWeather] = useState(initialWeather);
  const [range, setRange] = useState<BriefingRange>("today");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [marketRefreshing, setMarketRefreshing] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);

  const dateLabel = useMemo(() => {
    const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    const now = new Date();
    return `${weekdays[now.getDay()]} · ${now.getMonth() + 1}月${now.getDate()}日`;
  }, []);

  const visibleItems = useMemo(() => {
    return [...items]
      .filter((item) => category === "all" || item.category === category)
      .sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0) || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [items, category]);

  const grouped = {
    world: visibleItems.filter((item) => item.category === "world"),
    finance: visibleItems.filter((item) => item.category === "finance"),
    ai_tech: visibleItems.filter((item) => item.category === "ai_tech"),
    social_x: visibleItems.filter((item) => item.category === "social_x"),
  };

  async function refresh(nextRange = range, nextCategory = category) {
    setLoading(true);
    try {
      const res = await fetch(`/api/briefing/digest?range=${nextRange}&category=${nextCategory}`, { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setItems(json.items);
        setDigest(json.digest);
        setMarkets(json.markets);
        setWeather(json.weather);
        setMarketError(json.marketStatus?.error ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  const refreshMarkets = useCallback(async (force = false) => {
    setMarketRefreshing(true);
    try {
      const res = await fetch(`/api/briefing/markets${force ? "?refresh=1" : ""}`, { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setMarkets(json.markets);
        setMarketError(json.marketStatus?.error ?? null);
      } else {
        setMarketError(json.message ?? "行情更新失败");
      }
    } catch (error) {
      setMarketError(error instanceof Error ? error.message : "行情更新失败");
    } finally {
      setMarketRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      refreshMarkets(false);
    }, 60_000);

    return () => window.clearInterval(id);
  }, [refreshMarkets]);

  function patchItem(itemId: string, patch: Partial<Pick<NewsItemDTO, "isRead" | "isFavorited" | "isImported" | "importedNoteId">>) {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item)));
    setSelectedDetail((prev) => (prev?.item.id === itemId ? { ...prev, item: { ...prev.item, ...patch } } : prev));
    if (range === "favorites" && patch.isFavorited === false) {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  }

  function openDetail(item: NewsItemDTO, anchor: DetailAnchor) {
    setSelectedDetail({ item, anchor });
  }

  const columns = category === "all"
    ? [
        { key: "ai_tech" as const, title: "人工智能", eyebrow: "科技进展", items: grouped.ai_tech },
        { key: "social_x" as const, title: "X 监控", eyebrow: "社交舆情", items: grouped.social_x },
        { key: "finance" as const, title: "金融", eyebrow: "市场财经", items: grouped.finance },
        { key: "world" as const, title: "世界", eyebrow: "国际要闻", items: grouped.world },
      ]
    : [
        {
          key: category,
          title: categoryLabel(category),
          eyebrow: range === "favorites" ? "我的收藏" : range === "week" ? "本周追踪" : "今日更新",
          items: grouped[category],
        },
      ];

  return (
    <main className="mx-auto w-full max-w-[1720px] px-4 py-5 sm:px-6 lg:px-8">
      <BriefingHero digest={digest} total={visibleItems.length} range={range} />

      <div className="mt-4">
        <TopBar
          markets={markets}
          weather={weather}
          dateLabel={dateLabel}
          refreshing={marketRefreshing}
          error={marketError}
          onRefresh={() => refreshMarkets(true)}
        />
      </div>

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

      {loading && (
        <div className="mt-3 inline-flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Loader2 size={14} className="animate-spin" />
          正在更新简报
        </div>
      )}

      <motion.section
        key={`${range}-${category}`}
        variants={listStagger}
        initial="initial"
        animate="animate"
        className={`mt-4 grid gap-4 ${category === "all" ? "lg:grid-cols-4" : "lg:grid-cols-1"}`}
      >
        {columns.map((column) => (
          <NewsColumn
            key={column.key}
            title={column.title}
            eyebrow={column.eyebrow}
            items={column.items}
            limit={category === "all" ? 10 : 24}
            onPatchItem={patchItem}
            onClick={openDetail}
          />
        ))}
      </motion.section>

      {selectedDetail && (
        <NewsDetailModal
          item={selectedDetail.item}
          anchorRect={selectedDetail.anchor}
          onClose={() => setSelectedDetail(null)}
          onPatchItem={patchItem}
        />
      )}
    </main>
  );
}
