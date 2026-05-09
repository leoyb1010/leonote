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
    name: "英国广播公司中文网",
    url: "https://feeds.bbci.co.uk/zhongwen/simp/rss.xml",
    category: "world",
    region: "global",
    weight: 80,
  },
  {
    kind: "rss",
    name: "中国新闻网国际",
    url: "https://www.chinanews.com.cn/rss/world.xml",
    category: "world",
    region: "cn",
    weight: 76,
  },
  {
    kind: "rss",
    name: "中国新闻网财经",
    url: "https://www.chinanews.com.cn/rss/finance.xml",
    category: "finance",
    region: "cn",
    weight: 74,
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
    name: "36氪",
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
    name: "InfoQ 中文",
    url: "https://www.infoq.cn/feed",
    category: "ai_tech",
    region: "cn",
    weight: 72,
  },
  {
    kind: "rss",
    name: "少数派",
    url: "https://sspai.com/feed",
    category: "ai_tech",
    region: "cn",
    weight: 58,
  },
  {
    kind: "rss",
    name: "海外科技媒体",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    category: "ai_tech",
    region: "us",
    weight: 70,
  },
  {
    kind: "rss",
    name: "海外科技媒体",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    category: "ai_tech",
    region: "us",
    weight: 70,
  },
  {
    kind: "rss",
    name: "论文预印本",
    url: "https://export.arxiv.org/rss/cs.AI",
    category: "ai_tech",
    region: "global",
    weight: 55,
  },
  {
    kind: "rss",
    name: "X · OpenAI",
    url: "https://nitter.net/OpenAI/rss",
    category: "ai_tech",
    region: "us",
    weight: 85,
  },
  {
    kind: "rss",
    name: "X · Anthropic",
    url: "https://nitter.net/AnthropicAI/rss",
    category: "ai_tech",
    region: "us",
    weight: 85,
  },
  {
    kind: "rss",
    name: "X · Google DeepMind",
    url: "https://nitter.net/GoogleDeepMind/rss",
    category: "ai_tech",
    region: "us",
    weight: 85,
  },
  {
    kind: "rss",
    name: "X · Elon Musk",
    url: "https://nitter.net/elonmusk/rss",
    category: "ai_tech",
    region: "us",
    weight: 80,
  },
  {
    kind: "rss",
    name: "X · Sam Altman",
    url: "https://nitter.net/sama/rss",
    category: "ai_tech",
    region: "us",
    weight: 82,
  },
  {
    kind: "rss",
    name: "X · Andrej Karpathy",
    url: "https://nitter.net/karpathy/rss",
    category: "ai_tech",
    region: "us",
    weight: 80,
  },
];

export const MARKET_SYMBOLS = [
  { symbol: "000001.SS", name: "上证指数", category: "index_cn" },
  { symbol: "^HSI", name: "恒生指数", category: "index_global" },
  { symbol: "^IXIC", name: "纳斯达克", category: "index_global" },
  { symbol: "BTC-USD", name: "比特币", category: "crypto" },
  { symbol: "CNY=X", name: "美元/人民币", category: "fx" },
];
