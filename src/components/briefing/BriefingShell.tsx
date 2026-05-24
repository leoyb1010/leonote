"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock3, Database, Loader2, Tags } from "lucide-react";
import { BriefingHero, type BriefingHeroStats } from "./BriefingHero";
import { MeshGradient } from "@/components/base/MeshGradient";
import { BriefingFilters } from "./BriefingFilters";
import { NewsColumn } from "./NewsColumn";
import { NewsDetailModal } from "./NewsDetailModal";
import { DeepReadCard } from "./DeepReadCard";
import { EventRadar } from "./EventRadar";
import { EventDetailModal } from "./EventDetailModal";
import { ThinkingDetailModal } from "./ThinkingDetailModal";
import { ThinkingPanel } from "./ThinkingPanel";
import { listStagger } from "@/lib/animations";
import { PageContainer } from "@/components/layout/PageContainer";
import { categoryLabel } from "@/lib/briefing/display";
import type { BriefingCategory, BriefingDigestSummary, BriefingEventClusterDTO, BriefingMetaDTO, BriefingRange, BriefingThinkingInsight, HoroscopeDTO, MarketSnapshotDTO, NewsItemDTO, WeatherDTO } from "@/lib/briefing/types";

type CategoryFilter = BriefingCategory | "all";
type DetailAnchor = { top: number; left: number; width: number; height: number; x?: number; y?: number };
type SelectedDetail = { item: NewsItemDTO; anchor: DetailAnchor };
type SelectedThinkingDetail = { insight: BriefingThinkingInsight; anchor: DetailAnchor };
type SelectedEventDetail =
  | { event: BriefingEventClusterDTO; anchor: DetailAnchor };

interface Props {
  initialDigest: BriefingDigestSummary | null;
  initialItems: NewsItemDTO[];
  initialThinkingInsights: BriefingThinkingInsight[];
  initialEventClusters: BriefingEventClusterDTO[];
  initialMarkets: MarketSnapshotDTO[];
  initialWeather: WeatherDTO | null;
  initialHoroscopes: HoroscopeDTO[];
  initialMeta: BriefingMetaDTO;
}

function formatDateLabel() {
  const now = new Date();
  return now.toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

// 用上海时区的"自然日"作为简报跨日基准（与服务端 horoscope.ts shanghaiDayKey 对齐）
function shanghaiDayKey(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function formatShortTime(input: string | null) {
  if (!input) return "等待同步";
  return new Date(input).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildTopTags(items: NewsItemDTO[], limit = 6) {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const tag of item.aiTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

function buildStats(items: NewsItemDTO[]): BriefingHeroStats {
  const scored = items.map((item) => item.aiScore).filter((score): score is number => typeof score === "number");
  const averageScore = scored.length
    ? (scored.reduce((sum, score) => sum + score, 0) / scored.length) * 100
    : null;
  return {
    total: items.length,
    unread: items.filter((item) => !item.isRead).length,
    averageScore,
    topTags: buildTopTags(items, 5).map((item) => item.tag),
  };
}

function buildMarkdown(
  title: string,
  digest: BriefingDigestSummary | null,
  items: NewsItemDTO[],
  thinkingInsights: BriefingThinkingInsight[],
  eventClusters: BriefingEventClusterDTO[],
) {
  const lines = [
    `# ${title}`,
    "",
    "## 今日大事件雷达",
    ...(eventClusters.length
      ? eventClusters.slice(0, 7).map((event) => `- ${event.title}｜${event.impactLabel}：${event.summary}`)
      : ["- 正在等待足够清晰的大事件信号。"]),
    "",
    "## AI 协助思考",
    ...(thinkingInsights.length ? thinkingInsights : []).map((item) => `- ${item.title}：${item.question}`),
    ...(thinkingInsights.length ? [] : (digest?.headlines?.length ? digest.headlines : items.slice(0, 3).map((item) => item.title)).map((line) => `- ${line}`)),
    "",
    "## 精选资讯",
    ...items.slice(0, 8).map((item) => `- ${item.title} · ${item.sourceName}${item.aiSummary ? `：${item.aiSummary}` : ""}`),
  ];
  return lines.join("\n");
}

function TagInsights({ items }: { items: NewsItemDTO[] }) {
  const tags = buildTopTags(items, 8);
  const max = tags[0]?.count ?? 1;

  return (
    <section className="card-premium p-4 lg:p-5">
      <div className="mb-3 flex items-center gap-2 text-[11px] uppercase text-[var(--text-muted)]">
        <Tags size={13} />
        洞察
      </div>
      <h2 className="text-base font-semibold text-[var(--text-primary)]">标签与洞察</h2>
      {tags.length === 0 ? (
        <p className="quiet-inset mt-3 rounded-[var(--radius-lg)] px-3 py-8 text-center text-sm text-[var(--text-muted)]">
          标签正在生成。
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {tags.map((item) => (
            <div key={item.tag}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                <span className="text-[var(--text-secondary)]">{item.tag}</span>
                <span className="numeric-display text-[var(--text-muted)]">{item.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--material-inset)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)] opacity-75"
                  style={{ width: `${Math.max(16, (item.count / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function BriefingMetaPanel({ meta }: { meta: BriefingMetaDTO }) {
  const latestCron = meta.cron[0];

  return (
    <section className="card-premium p-4 lg:p-5">
      <div className="mb-4 flex items-center gap-2 text-[11px] uppercase text-[var(--text-muted)]">
        <Database size={13} />
        来源
      </div>
      <div className="grid gap-3 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--hairline)] pb-2.5">
          <span>生成时间</span>
          <span className="text-[var(--text-muted)]">{formatShortTime(meta.generatedAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-[var(--hairline)] pb-2.5">
          <span>新闻同步</span>
          <span className="text-[var(--text-muted)]">{formatShortTime(meta.latestNewsFetchAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-[var(--hairline)] pb-2.5">
          <span>数据来源</span>
          <span className="numeric-display text-[var(--text-muted)]">{meta.sourceCount} 个</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Cron 状态</span>
          {latestCron ? (
            <span className={`inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-1 ${latestCron.ok ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--danger-soft)] text-[var(--danger)]"}`}>
              {latestCron.ok ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              {latestCron.task}
            </span>
          ) : (
            <span className="text-[var(--text-muted)]">暂无记录</span>
          )}
        </div>
      </div>
    </section>
  );
}

export function BriefingShell({
  initialDigest,
  initialItems,
  initialThinkingInsights,
  initialEventClusters,
  initialMarkets,
  initialWeather,
  initialHoroscopes,
  initialMeta,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [thinkingInsights, setThinkingInsights] = useState(initialThinkingInsights);
  const [eventClusters, setEventClusters] = useState(initialEventClusters);
  const [digest, setDigest] = useState(initialDigest);
  const [markets, setMarkets] = useState(initialMarkets);
  const [weather, setWeather] = useState(initialWeather);
  const [horoscopes, setHoroscopes] = useState(initialHoroscopes);
  const [meta, setMeta] = useState(initialMeta);
  const [range, setRange] = useState<BriefingRange>("today");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [briefingTitle, setBriefingTitle] = useState("每日简报");
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail | null>(null);
  const [selectedThinkingDetail, setSelectedThinkingDetail] = useState<SelectedThinkingDetail | null>(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState<SelectedEventDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [importingDigest, setImportingDigest] = useState(false);
  const [copied, setCopied] = useState(false);
  const [marketRefreshing, setMarketRefreshing] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const dateLabel = useMemo(() => formatDateLabel(), []);

  const visibleItems = useMemo(() => {
    return [...items]
      .filter((item) => category === "all" || item.category === category)
      .sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0) || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }, [items, category]);

  const stats = useMemo(() => buildStats(visibleItems), [visibleItems]);
  const eventItemIds = useMemo(() => new Set(eventClusters.flatMap((event) => event.itemIds)), [eventClusters]);
  const featuredItems = useMemo(() => visibleItems.filter((item) => !eventItemIds.has(item.id)).slice(0, category === "all" ? 4 : 3), [eventItemIds, visibleItems, category]);
  const featuredIds = useMemo(() => new Set(featuredItems.map((item) => item.id)), [featuredItems]);
  const streamItems = useMemo(() => visibleItems.filter((item) => !featuredIds.has(item.id)), [featuredIds, visibleItems]);
  const deepRead = useMemo(() => (
    [...visibleItems]
      .filter((item) => item.detailText.length > 120 || item.aiKeyPoints.length >= 2)
      .sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0))[0] ?? null
  ), [visibleItems]);

  async function refresh(nextRange = range, nextCategory = category, force = false) {
    setLoading(true);
    setRefreshError(null);
    try {
      const res = await fetch(`/api/briefing/digest?range=${encodeURIComponent(nextRange)}&category=${encodeURIComponent(nextCategory)}${force ? "&refresh=1" : ""}`, { cache: "no-store" });
      const json = await res.json();
      if (json.ok) {
        setItems(json.items);
        setThinkingInsights(json.thinkingInsights || []);
        setEventClusters(json.eventClusters || []);
        setDigest(json.digest);
        setMarkets(json.markets);
        setWeather(json.weather);
        setHoroscopes(json.horoscopes || []);
        setMeta(json.meta);
        setMarketError(json.marketStatus?.error ?? null);
      } else {
        setRefreshError(json.message ?? "简报更新失败");
      }
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : "简报更新失败");
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
    let id: number | null = null;
    const start = () => {
      if (id != null) return;
      id = window.setInterval(() => {
        void refreshMarkets(false);
      }, 60_000);
    };
    const stop = () => {
      if (id == null) return;
      window.clearInterval(id);
      id = null;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshMarkets]);

  // 跨日自动刷新：以上海时区为准，检测到换天就 force refresh 一次（星座/精选/digest 都会跟着更新）
  const refreshRef = useRef<(r?: BriefingRange, c?: CategoryFilter, force?: boolean) => Promise<void>>(() => Promise.resolve());
  useEffect(() => {
    refreshRef.current = (r, c, force) => refresh(r ?? range, c ?? category, force ?? false);
  });
  useEffect(() => {
    let lastDay = shanghaiDayKey();
    const check = () => {
      const today = shanghaiDayKey();
      if (today !== lastDay) {
        lastDay = today;
        void refreshRef.current(undefined, undefined, true);
      }
    };
    const interval = window.setInterval(check, 60_000);
    const onVisibility = () => {
      if (!document.hidden) check();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

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

  function openDeepRead(item: NewsItemDTO) {
    setSelectedDetail({
      item,
      anchor: {
        top: Math.max(24, window.innerHeight * 0.18),
        left: Math.max(18, window.innerWidth - 460),
        width: 360,
        height: 360,
      },
    });
  }

  async function importDigest() {
    if (importingDigest || visibleItems.length === 0) return;
    setImportingDigest(true);
    try {
      await fetch("/api/briefing/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "digest" }),
      });
    } finally {
      setImportingDigest(false);
    }
  }

  async function copySummary() {
    if (visibleItems.length === 0) return;
    try {
      await navigator.clipboard.writeText(buildMarkdown(briefingTitle || "每日简报", digest, visibleItems, thinkingInsights, eventClusters));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setRefreshError("复制失败");
    }
  }

  const streamTitle = category === "all" ? "全部资讯" : `${categoryLabel(category)}资讯`;
  return (
    <div className="relative min-h-screen">
      <MeshGradient />
      <div className="relative z-10">
        <PageContainer width="dashboard">
      <BriefingHero
        digest={digest}
        stats={stats}
        markets={markets}
        weather={weather}
        horoscopes={horoscopes}
        dateLabel={dateLabel}
        range={range}
        title={briefingTitle}
        loading={loading}
        importingDigest={importingDigest}
        copied={copied}
        marketRefreshing={marketRefreshing}
        marketError={marketError}
        onRefresh={() => void refresh(range, category, true)}
        onImportDigest={() => void importDigest()}
        onCopySummary={() => void copySummary()}
        onMarketRefresh={() => void refreshMarkets(true)}
        onTitleChange={setBriefingTitle}
      />

      <div className="mt-5 flex flex-wrap gap-3 border-b border-[var(--hairline)] pb-4 lg:items-center lg:justify-between">
        <BriefingFilters
          range={range}
          category={category}
          onRangeChange={(next) => {
            setRange(next);
            void refresh(next, category);
          }}
          onCategoryChange={(next) => {
            setCategory(next);
            void refresh(range, next);
          }}
        />
        <div className="flex min-h-6 min-w-0 items-center gap-2 text-xs text-[var(--text-muted)]">
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              正在更新简报
            </>
          ) : refreshError ? (
            <>
              <AlertCircle size={14} className="text-[var(--danger)]" />
              <span className="truncate">{refreshError}</span>
            </>
          ) : (
            <>
              <Clock3 size={14} />
              <span className="truncate">最近生成 {formatShortTime(meta.generatedAt)}</span>
            </>
          )}
        </div>
      </div>

      <motion.section
        key={`${range}-${category}`}
        variants={listStagger}
        initial="initial"
        animate="animate"
        className="mt-4 grid gap-5 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px] 2xl:gap-8 3xl:grid-cols-[minmax(0,1fr)_440px]"
      >
        <div className="space-y-6 lg:space-y-8">
          <div id="briefing-radar" className="scroll-mt-20">
            <EventRadar
              events={eventClusters}
              onOpenEvent={(event, anchor) => setSelectedEventDetail({ event, anchor })}
            />
          </div>

          <NewsColumn
            sectionId="briefing-featured"
            title="今日精选"
            eyebrow="精选"
            items={featuredItems}
            limit={category === "all" ? 4 : 3}
            featured
            dense
            emptyText="大事件之外暂时没有更多高质量证据。"
            onPatchItem={patchItem}
            onClick={openDetail}
          />

          <div id="briefing-thinking" className="scroll-mt-20 space-y-4 lg:hidden">
            <ThinkingPanel
              insights={thinkingInsights}
              onOpen={(insight, anchor) => setSelectedThinkingDetail({ insight, anchor })}
            />
            <DeepReadCard item={deepRead} onClick={openDeepRead} />
          </div>

          <NewsColumn
            sectionId="briefing-stream"
            title={streamTitle}
            eyebrow={range === "favorites" ? "收藏" : range === "week" ? "本周" : "资讯流"}
            items={streamItems}
            limit={range === "week" ? 36 : 18}
            dense
            emptyText="当前筛选下没有更多资讯。"
            onPatchItem={patchItem}
            onClick={openDetail}
          />
        </div>

        <aside className="hidden space-y-4 lg:sticky lg:top-6 lg:block lg:self-start lg:space-y-5">
          <ThinkingPanel
            insights={thinkingInsights}
            onOpen={(insight, anchor) => setSelectedThinkingDetail({ insight, anchor })}
          />
          <DeepReadCard item={deepRead} onClick={openDeepRead} />
          <TagInsights items={visibleItems} />
          <BriefingMetaPanel meta={meta} />
        </aside>

        <div className="space-y-4 lg:hidden">
          <TagInsights items={visibleItems} />
          <BriefingMetaPanel meta={meta} />
        </div>
      </motion.section>

      {selectedDetail ? (
        <NewsDetailModal
          item={selectedDetail.item}
          anchorRect={selectedDetail.anchor}
          onClose={() => setSelectedDetail(null)}
          onPatchItem={patchItem}
        />
      ) : null}
      <EventDetailModal
        selected={selectedEventDetail}
        items={items}
        onClose={() => setSelectedEventDetail(null)}
      />
      <ThinkingDetailModal
        selected={selectedThinkingDetail}
        onClose={() => setSelectedThinkingDetail(null)}
      />
        </PageContainer>
      </div>
    </div>
  );
}
