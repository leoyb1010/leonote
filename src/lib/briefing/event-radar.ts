import { sanitizeBriefingText } from "./normalize";
import type { BriefingEventClusterDTO, BriefingEventScope, BriefingXSignalDTO, NewsItemDTO } from "./types";

type EventTheme = {
  id: string;
  scope: BriefingEventScope;
  label: string;
  match: RegExp;
  weight: number;
  why: string;
};

type ClusterDraft = {
  id: string;
  theme: EventTheme;
  items: NewsItemDTO[];
};

const X_SOURCE_RE = /^X\s*[·-]/i;

const THEMES: EventTheme[] = [
  {
    id: "frontier-ai",
    scope: "ai_tech",
    label: "AI 科技",
    match: /OpenAI|Anthropic|Claude|DeepMind|Gemini|GPT|Sora|Llama|Meta AI|xAI|大模型|多模态|推理|智能体|Agent|AI\s?搜索|AI\s?助手|生成式|人工智能/i,
    weight: 96,
    why: "它可能改变模型能力、产品入口、开发方式或算力需求，是今天最值得优先看的科技变量。",
  },
  {
    id: "ai-compute-chip",
    scope: "ai_tech",
    label: "算力芯片",
    match: /NVIDIA|英伟达|黄仁勋|Jensen|GPU|TPU|ASIC|H100|H200|B200|GB200|Blackwell|Rubin|芯片|半导体|算力|数据中心|HBM|台积电|ASML/i,
    weight: 92,
    why: "算力供给会直接传导到 AI 产品成本、云厂商投入、国产替代和资本市场定价。",
  },
  {
    id: "geopolitics-policy",
    scope: "international",
    label: "国际大事",
    match: /中美|美中|美国|中国|欧盟|俄罗斯|乌克兰|中东|以色列|伊朗|联合国|总统|白宫|外交|贸易|关税|制裁|出口管制|法案|监管|协议|战争|冲突|选举/i,
    weight: 86,
    why: "这类事件的价值在于制度约束是否变化，以及是否传导到技术、资本、供应链和市场预期。",
  },
  {
    id: "china-domestic",
    scope: "domestic",
    label: "国内大事",
    match: /国务院|发改委|工信部|央行|证监会|商务部|财政部|监管|政策|房地产|消费|就业|教育|医疗|A股|港股|国产|华为|阿里|腾讯|字节|百度|小米|比亚迪/i,
    weight: 82,
    why: "国内政策、产业和大公司动作会影响需求、流量入口、供应链与资产价格。",
  },
  {
    id: "market-pricing",
    scope: "market",
    label: "市场定价",
    match: /市场|股|财报|融资|并购|上市|债|利率|降息|通胀|美元|人民币|黄金|原油|BTC|比特币|订单|营收|利润|估值|美股|纳斯达克/i,
    weight: 76,
    why: "市场新闻要看资金偏好是否变化，而不是单日涨跌本身。",
  },
  {
    id: "security-trust",
    scope: "ai_tech",
    label: "安全信任",
    match: /漏洞|攻击|泄露|勒索|安全|隐私|数据|后门|供应链攻击|合规|版权|深度伪造|deepfake|prompt injection|提示词注入/i,
    weight: 74,
    why: "安全与信任事件会影响企业采购、产品边界和平台开放策略。",
  },
  {
    id: "x-signal",
    scope: "x_signal",
    label: "X 信号",
    match: /X监控|X\s*[·-]|twitter|tweet|post|发布|宣布|thread|转发/i,
    weight: 70,
    why: "关键人物和机构的 X 动态常常比正式新闻更早透露产品、政策和市场情绪的变化。",
  },
];

const SCOPE_LABEL: Record<BriefingEventScope, string> = {
  domestic: "国内",
  international: "国际",
  ai_tech: "AI 科技",
  market: "市场",
  x_signal: "X 信号",
};

const STOP_WORDS = /^(今天|这个|那个|开始|继续|正在|最新|消息|表示|发布|宣布|公司|市场|国际|国内|中国|美国|科技|资讯|关注|可能|成为)$/;

function words(input: string) {
  const text = input.toLowerCase();
  const zh = text.match(/[\u4e00-\u9fa5]{2,6}/g) ?? [];
  const en = text.match(/[a-z][a-z0-9.+-]{2,}/g) ?? [];
  return [...zh, ...en]
    .map((item) => item.trim())
    .filter((item) => item.length >= 2 && !STOP_WORDS.test(item))
    .slice(0, 80);
}

function overlap(a: string, b: string) {
  const aWords = new Set(words(a));
  const bWords = new Set(words(b));
  if (aWords.size === 0 || bWords.size === 0) return 0;
  let hit = 0;
  for (const word of aWords) {
    if (bWords.has(word)) hit += 1;
  }
  return hit / Math.min(aWords.size, bWords.size);
}

function isDomestic(item: NewsItemDTO) {
  const text = `${item.title} ${item.sourceName} ${item.aiSummary ?? ""} ${item.aiTags.join(" ")}`;
  return /中国|国内|国务院|工信部|发改委|A股|港股|华为|阿里|腾讯|字节|百度|小米|比亚迪|IT之家|少数派|微博|知乎|中国新闻网/i.test(text);
}

function themeFor(item: NewsItemDTO): EventTheme {
  const text = `${item.title} ${item.aiSummary ?? ""} ${item.detailText} ${item.sourceName} ${item.aiTags.join(" ")}`;
  const matched = THEMES
    .filter((theme) => theme.match.test(text))
    .sort((a, b) => b.weight - a.weight)[0];
  if (matched) {
    if (matched.scope === "international" && isDomestic(item) && !/中美|美中|美国|欧盟|联合国|外交|关税|制裁|出口管制/i.test(text)) {
      return THEMES.find((theme) => theme.id === "china-domestic") ?? matched;
    }
    return matched;
  }
  if (item.category === "finance") return THEMES.find((theme) => theme.id === "market-pricing") ?? THEMES[0];
  if (item.category === "world") return isDomestic(item)
    ? THEMES.find((theme) => theme.id === "china-domestic") ?? THEMES[0]
    : THEMES.find((theme) => theme.id === "geopolitics-policy") ?? THEMES[0];
  return THEMES.find((theme) => theme.id === "frontier-ai") ?? THEMES[0];
}

function sourceWeight(sourceName: string) {
  if (/OpenAI|DeepMind|Google|NVIDIA|GitHub|Cloudflare|联合国|BBC|纽约时报|CNBC|Reuters|The Verge|TechCrunch|MIT|新华社|中国新闻网|IT之家/i.test(sourceName)) return 12;
  if (/X\s*[·-]/i.test(sourceName)) return 10;
  return 4;
}

function itemImpact(item: NewsItemDTO, theme: EventTheme) {
  const ageHours = Math.max(0, (Date.now() - new Date(item.publishedAt).getTime()) / 3_600_000);
  const recency = Math.max(0, 16 - ageHours * 0.85);
  const quality = (item.aiScore ?? 0.55) * 34;
  const source = sourceWeight(item.sourceName);
  const tagBoost = item.aiTags.some((tag) => theme.match.test(tag)) ? 8 : 0;
  return theme.weight + quality + recency + source + tagBoost;
}

function clusterId(theme: EventTheme, item: NewsItemDTO) {
  const keyword = words(`${item.title} ${item.aiTags.join(" ")}`)[0] ?? item.id.slice(0, 8);
  return `${theme.id}-${keyword}`;
}

function buildFacts(items: NewsItemDTO[]) {
  const facts: string[] = [];
  for (const item of items) {
    for (const point of item.aiKeyPoints) {
      const clean = sanitizeBriefingText(point, 76);
      if (clean && !facts.some((fact) => overlap(fact, clean) > 0.5)) facts.push(clean);
      if (facts.length >= 3) return facts;
    }
    const summary = sanitizeBriefingText(item.aiSummary || item.excerpt, 76);
    if (summary && !facts.some((fact) => overlap(fact, summary) > 0.5)) facts.push(summary);
    if (facts.length >= 3) return facts;
  }
  return facts;
}

function impactLabel(score: number) {
  if (score >= 150) return "高影响";
  if (score >= 128) return "值得追踪";
  if (score >= 106) return "有信号";
  return "观察";
}

export function buildBriefingEventRadar(items: NewsItemDTO[], limit = 8): BriefingEventClusterDTO[] {
  const sourceItems = items
    .filter((item) => item.category !== "social_x" || X_SOURCE_RE.test(item.sourceName) || (item.aiScore ?? 0) >= 0.62)
    .slice(0, 120);

  const clusters: ClusterDraft[] = [];

  for (const item of sourceItems) {
    const theme = X_SOURCE_RE.test(item.sourceName) ? THEMES.find((entry) => entry.id === "x-signal") ?? themeFor(item) : themeFor(item);
    const text = `${item.title} ${item.aiSummary ?? ""} ${item.aiTags.join(" ")}`;
    const existing = clusters.find((cluster) => {
      if (cluster.theme.id !== theme.id && cluster.theme.scope !== theme.scope) return false;
      return cluster.items.some((clusterItem) => overlap(`${clusterItem.title} ${clusterItem.aiSummary ?? ""}`, text) >= 0.28);
    });
    if (existing) {
      existing.items.push(item);
    } else {
      clusters.push({ id: clusterId(theme, item), theme, items: [item] });
    }
  }

  return clusters
    .map((cluster) => {
      const sortedItems = [...cluster.items].sort((a, b) => {
        const theme = cluster.theme;
        return itemImpact(b, theme) - itemImpact(a, theme);
      });
      const top = sortedItems[0];
      const latestAt = sortedItems.reduce((latest, item) => {
        const time = new Date(item.publishedAt).getTime();
        return time > latest ? time : latest;
      }, 0);
      const sources = Array.from(new Set(sortedItems.map((item) => item.sourceName))).slice(0, 5);
      const tags = Array.from(new Set(sortedItems.flatMap((item) => item.aiTags))).slice(0, 5);
      const clusterBoost = Math.min(24, sortedItems.length * 5 + sources.length * 4);
      const score = Math.round(itemImpact(top, cluster.theme) + clusterBoost);
      const facts = buildFacts(sortedItems);
      const summary = sanitizeBriefingText(top.aiSummary || top.excerpt || top.detailText, 126);
      return {
        id: cluster.id,
        title: sanitizeBriefingText(top.title, 58),
        scope: cluster.theme.scope,
        scopeLabel: SCOPE_LABEL[cluster.theme.scope],
        impactLabel: impactLabel(score),
        impactScore: Math.max(60, Math.min(99, Math.round(score / 1.65))),
        summary,
        whyItMatters: cluster.theme.why,
        facts: facts.length > 0 ? facts : [summary].filter(Boolean),
        sourceNames: sources,
        sourceCount: sources.length,
        latestAt: new Date(latestAt || Date.now()).toISOString(),
        tags,
        itemIds: sortedItems.map((item) => item.id).slice(0, 8),
      } satisfies BriefingEventClusterDTO;
    })
    .sort((a, b) => b.impactScore - a.impactScore || new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime())
    .slice(0, limit);
}

export function buildBriefingXSignals(items: NewsItemDTO[], limit = 8): BriefingXSignalDTO[] {
  return items
    .filter((item) => X_SOURCE_RE.test(item.sourceName) || item.aiTags.some((tag) => /X监控|Twitter|Tweet/i.test(tag)))
    .sort((a, b) => (b.aiScore ?? 0) - (a.aiScore ?? 0) || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit)
    .map((item) => {
      let username = item.sourceName.replace(/^X\s*[·-]\s*/i, "").trim() || "x";
      try {
        const pathUser = new URL(item.url).pathname.split("/").filter(Boolean)[0];
        if (pathUser) username = pathUser;
      } catch {
        // Keep the source label when the URL is not parseable.
      }
      return {
        id: `x-${item.id}`,
        itemId: item.id,
        authorName: item.sourceName.replace(/^X\s*[·-]\s*/i, "").trim() || username,
        username,
        title: sanitizeBriefingText(item.title, 64),
        summary: sanitizeBriefingText(item.aiSummary || item.detailText || item.excerpt, 126),
        url: item.url,
        publishedAt: item.publishedAt,
        impactLabel: (item.aiScore ?? 0) >= 0.78 ? "强信号" : (item.aiScore ?? 0) >= 0.62 ? "可追踪" : "观察",
        tags: item.aiTags.slice(0, 4),
        score: item.aiScore,
      } satisfies BriefingXSignalDTO;
    });
}
