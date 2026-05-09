import type { BriefingCategory, MarketSnapshotDTO } from "./types";

const CJK_RE = /[\u3400-\u9fff]/g;
const LATIN_WORD_RE = /[A-Za-z][A-Za-z0-9.+-]{1,}/g;
const ALLOWED_LATIN_WORDS = new Set([
  "AI",
  "AIGC",
  "API",
  "CPU",
  "GPU",
  "ETF",
  "IPO",
  "CPI",
  "GDP",
  "OpenAI",
  "ChatGPT",
  "GPT",
  "DeepSeek",
  "Claude",
  "Gemini",
  "Google",
  "Meta",
  "Apple",
  "Tesla",
  "NVIDIA",
  "AMD",
  "iPhone",
  "iPad",
  "Mac",
  "App",
]);

const SOURCE_NAME_MAP: Record<string, string> = {
  "36Kr": "36氪",
  "36kr": "36氪",
  "BBC 中文": "英国广播公司中文网",
  "TechCrunch AI": "海外科技媒体",
  "The Verge AI": "海外科技媒体",
  "arXiv cs.AI": "论文预印本",
  "Tavily · 世界": "聚合资讯 · 世界",
  "Tavily · 金融": "聚合资讯 · 金融",
  "Tavily · AI 科技": "聚合资讯 · 人工智能",
};

const MARKET_NAME_MAP: Record<string, string> = {
  BTC: "比特币",
  "BTC-USD": "比特币",
  ETH: "以太坊",
  "ETH-USD": "以太坊",
  "USD/CNY": "美元/人民币",
  "USD-CNY": "美元/人民币",
  "CNY=X": "美元/人民币",
};

const AI_NEWS_KEYWORDS = /人工智能|大模型|AI|芯片|算力|机器人|自动驾驶|半导体|软件|云计算|数据中心|算法|OpenAI|DeepSeek|模型|智能体/i;
const FINANCE_NEWS_KEYWORDS = /股|证券|基金|债|央行|利率|人民币|美元|黄金|白银|原油|期货|财报|营收|利润|上市|并购|融资|投资|银行|保险|房地产|车企|公司|产业|经济|消费|订单|价格|指数|新能源|港元|减持|增资|工厂|市场|零售|批发/;

export const CATEGORY_LABELS: Record<BriefingCategory, string> = {
  world: "世界",
  finance: "金融",
  ai_tech: "人工智能",
  social_x: "X 监控",
};

export const MARKET_CATEGORY_LABELS: Record<string, string> = {
  index_cn: "A 股",
  index_global: "港美",
  metal: "贵金属",
  crypto: "加密资产",
  fx: "汇率",
};

export function hasChineseSignal(input: string | null | undefined): boolean {
  return (input?.match(CJK_RE)?.length ?? 0) >= 4;
}

export function hasNoisyEnglish(input: string | null | undefined): boolean {
  const text = input?.trim() ?? "";
  if (!text) return false;
  const words = text.match(LATIN_WORD_RE) ?? [];
  const noisy = words.filter((word) => !ALLOWED_LATIN_WORDS.has(word));
  return noisy.length > 1 || /\b(BBC\s+News|AP\s+News|CBS\s+News|Reuters|Bloomberg)\b/i.test(text);
}

export function isLowValueBriefingTitle(input: string | null | undefined): boolean {
  const text = input?.trim() ?? "";
  if (!text) return true;
  return (
    /新闻与动态|世界新闻与国际头条|突发新闻、?最新头条|最新头条和视频|最新消息|完整报道|官方网站/.test(text) ||
    /^(国际|世界|财经|科技)\s*[-|]/.test(text)
  );
}

export function needsChineseDisplay(input: string | null | undefined): boolean {
  const text = input?.trim() ?? "";
  if (!text) return false;
  const cjkCount = text.match(CJK_RE)?.length ?? 0;
  const latinWords = text.match(LATIN_WORD_RE)?.length ?? 0;
  return cjkCount < 4 || hasNoisyEnglish(text) || (latinWords >= 4 && cjkCount < latinWords * 2);
}

export function isDisplayableChinese(title: string, excerpt?: string | null, summary?: string | null, sourceName?: string): boolean {
  if (sourceName?.startsWith("X ·")) return true; // X 监控源强制显示
  return !isLowValueBriefingTitle(title) && !hasNoisyEnglish(title) && (hasChineseSignal(title) || (needsChineseDisplay(title) === false && (hasChineseSignal(summary) || hasChineseSignal(excerpt))));
}

export function sourceDisplayName(name: string, category?: BriefingCategory | string): string {
  if (SOURCE_NAME_MAP[name]) return SOURCE_NAME_MAP[name];
  if (/tavily/i.test(name)) {
    const label = category === "world" || category === "finance" || category === "ai_tech"
      ? CATEGORY_LABELS[category]
      : "资讯";
    return `聚合资讯 · ${label}`;
  }
  if (/techcrunch|verge/i.test(name)) return "海外科技媒体";
  if (/arxiv/i.test(name)) return "论文预印本";
  if (/bbc/i.test(name)) return "英国广播公司中文网";
  return name.replace(/\bAI\b/g, "人工智能").replace(/\bKr\b/g, "氪");
}

export function marketDisplayName(item: Pick<MarketSnapshotDTO, "symbol" | "name">): string {
  return MARKET_NAME_MAP[item.name] ?? MARKET_NAME_MAP[item.symbol] ?? item.name;
}

export function marketCategoryLabel(category: string): string {
  return MARKET_CATEGORY_LABELS[category] ?? "市场";
}

export function categoryLabel(category: BriefingCategory): string {
  return CATEGORY_LABELS[category];
}

export function deriveDisplayCategory(input: {
  category: string;
  sourceName: string;
  title: string;
  excerpt?: string | null;
}): BriefingCategory {
  if (input.sourceName.startsWith("X ·")) return "social_x";
  if (input.category === "world" || input.category === "finance") return input.category;

  const text = `${input.sourceName} ${input.title} ${input.excerpt ?? ""}`;
  const titleHasAi = AI_NEWS_KEYWORDS.test(input.title);
  const hasFinanceSignal = FINANCE_NEWS_KEYWORDS.test(text) || /36氪|36Kr/i.test(input.sourceName);

  if (hasFinanceSignal && !titleHasAi) return "finance";
  if (AI_NEWS_KEYWORDS.test(text)) return "ai_tech";
  if (hasFinanceSignal) return "finance";
  return "ai_tech";
}
