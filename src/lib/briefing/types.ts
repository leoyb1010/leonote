export type BriefingCategory = "world" | "finance" | "ai_tech";
export type BriefingRange = "today" | "week" | "favorites";

export interface BriefingHeadline {
  text: string;
  source?: string;
}

export interface BriefingDigestSummary {
  weekday: string;
  dateLabel: string;
  weather?: string;
  headlines: string[];
}

export interface BriefingThinkingInsight {
  id: string;
  title: string;
  thesis: string;
  question: string;
  whyItMatters: string;
  impactLabel: string;
  confidence: number;
  sourceTitles: string[];
  habitSignals: string[];
  tags: string[];
}

export type BriefingEventScope = "domestic" | "international" | "ai_tech" | "market";

export interface BriefingEventClusterDTO {
  id: string;
  title: string;
  scope: BriefingEventScope;
  scopeLabel: string;
  impactLabel: string;
  impactScore: number;
  summary: string;
  whyItMatters: string;
  facts: string[];
  sourceNames: string[];
  sourceCount: number;
  latestAt: string;
  tags: string[];
  itemIds: string[];
}

export interface BriefingMetaDTO {
  generatedAt: string | null;
  latestNewsFetchAt: string | null;
  sourceCount: number;
  cron: Array<{
    task: string;
    ok: boolean;
    message: string;
    startedAt: string;
    endedAt: string | null;
  }>;
}

export interface NewsItemDTO {
  id: string;
  title: string;
  url: string;
  imageUrl: string | null;
  excerpt: string;
  detailText: string;
  category: BriefingCategory;
  sourceName: string;
  publishedAt: string;
  aiSummary: string | null;
  aiKeyPoints: string[];
  aiTags: string[];
  aiScore: number | null;
  readingMinutes: number;
  isRead: boolean;
  isFavorited: boolean;
  isImported: boolean;
  importedNoteId: string | null;
}

export interface MarketSnapshotDTO {
  symbol: string;
  name: string;
  category: string;
  price: number;
  changePct: number;
  changeAbs: number;
  points: number[];
  capturedAt: string;
}

export interface WeatherDTO {
  temp: number;
  weatherCode: number;
  weatherLabel: string;
  humidity: number;
  windSpeed: number;
}

export interface HoroscopeDTO {
  id: "leo" | "ellen" | "bubu";
  name: string;
  relation: string;
  signName: string;
  signKey: "libra" | "pisces" | "gemini";
  stars: number;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  sourceDate: string;
  updatedAt: string;
  isFallback: boolean;
}
