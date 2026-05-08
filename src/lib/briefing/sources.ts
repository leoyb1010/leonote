import type { BriefingCategory } from "./types";

export interface PresetNewsSource {
  kind: "rss";
  name: string;
  url: string;
  category: BriefingCategory;
  region: "cn" | "global" | "us";
  weight: number;
}

export const PRESET_NEWS_SOURCES: PresetNewsSource[] = [
  {
    kind: "rss",
    name: "BBC 中文",
    url: "https://feeds.bbci.co.uk/zhongwen/simp/rss.xml",
    category: "world",
    region: "global",
    weight: 80,
  },
  {
    kind: "rss",
    name: "纽约时报中文网",
    url: "https://cn.nytimes.com/rss/",
    category: "world",
    region: "global",
    weight: 70,
  },
  {
    kind: "rss",
    name: "36Kr",
    url: "https://36kr.com/feed",
    category: "ai_tech",
    region: "cn",
    weight: 65,
  },
  {
    kind: "rss",
    name: "极客公园",
    url: "https://www.geekpark.net/rss",
    category: "ai_tech",
    region: "cn",
    weight: 75,
  },
  {
    kind: "rss",
    name: "TechCrunch AI",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    category: "ai_tech",
    region: "us",
    weight: 70,
  },
  {
    kind: "rss",
    name: "The Verge AI",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    category: "ai_tech",
    region: "us",
    weight: 70,
  },
  {
    kind: "rss",
    name: "arXiv cs.AI",
    url: "https://export.arxiv.org/rss/cs.AI",
    category: "ai_tech",
    region: "global",
    weight: 55,
  },
];

export const MARKET_SYMBOLS = [
  { symbol: "000001.SS", name: "上证指数", category: "index_cn" },
  { symbol: "^HSI", name: "恒生指数", category: "index_global" },
  { symbol: "^IXIC", name: "纳斯达克", category: "index_global" },
  { symbol: "BTC-USD", name: "BTC", category: "crypto" },
  { symbol: "CNY=X", name: "USD/CNY", category: "fx" },
];
