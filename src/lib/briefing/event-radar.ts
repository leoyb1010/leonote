import { sanitizeBriefingText } from "./normalize";
import { isLowValueCommunityItem } from "./display";
import type { BriefingEventClusterDTO, BriefingEventScope, NewsItemDTO } from "./types";

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

const THEMES: EventTheme[] = [
  {
    id: "global-public",
    scope: "international",
    label: "国际大事",
    match: /总统|白宫|国会|欧盟|联合国|俄罗斯|乌克兰|中东|以色列|伊朗|印度|日本|韩国|英国|法国|德国|外交|贸易|关税|制裁|出口管制|战争|冲突|停火|选举|移民|气候|能源|G7|G20|NATO|北约/i,
    weight: 94,
    why: "它可能改变政策边界、地缘关系、能源供给、贸易成本或全球市场预期，是需要先判断传导路径的大事件。",
  },
  {
    id: "domestic-public",
    scope: "domestic",
    label: "国内大事",
    match: /我国|全国|国家|国务院|发改委|工信部|央行|证监会|商务部|财政部|监管|政策|房地产|消费|就业|教育|医疗|航天|火箭|卫星|地震|台风|事故|标准|新规|A股|港股|新华社|央视|中国新闻网/i,
    weight: 91,
    why: "国内公共事件、政策和产业动作会影响生活秩序、需求结构、供应链与资产价格。",
  },
  {
    id: "frontier-ai",
    scope: "ai_tech",
    label: "AI 科技",
    match: /OpenAI|Anthropic|Claude|DeepMind|Gemini|GPT|Sora|Llama|Meta AI|xAI|大模型|多模态|推理|智能体|Agent|AI\s?搜索|AI\s?助手|生成式|人工智能/i,
    weight: 90,
    why: "它可能改变模型能力、产品入口、开发方式或算力需求，是今天最值得优先看的科技变量。",
  },
  {
    id: "ai-compute-chip",
    scope: "ai_tech",
    label: "算力芯片",
    match: /NVIDIA|英伟达|黄仁勋|Jensen|GPU|TPU|ASIC|H100|H200|B200|GB200|Blackwell|Rubin|芯片|半导体|算力|数据中心|HBM|台积电|ASML/i,
    weight: 88,
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
    id: "tech-industry",
    scope: "ai_tech",
    label: "科技产业",
    match: /手机|汽车|机器人|家电|耳机|平板|电脑|游戏|电商|京东|淘宝|小米|荣耀|华为|苹果|特斯拉|比亚迪|产品|发布|预售|国标|行业标准|供应链/i,
    weight: 64,
    why: "科技产业新闻要看它是否改变入口、价格、供应链或用户行为，而不只是新品发布本身。",
  },
];

const SCOPE_LABEL: Record<BriefingEventScope, string> = {
  domestic: "国内",
  international: "国际",
  ai_tech: "AI 科技",
  market: "市场",
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
  if (item.category === "finance") return THEMES.find((theme) => theme.id === "market-pricing") ?? THEMES[0];
  if (item.category === "world") {
    return isDomestic(item)
      ? THEMES.find((theme) => theme.id === "domestic-public") ?? THEMES[0]
      : THEMES.find((theme) => theme.id === "global-public") ?? THEMES[0];
  }

  const matched = THEMES
    .sort((a, b) => b.weight - a.weight)
    .find((theme) => theme.match.test(text));
  if (matched) {
    if (matched.scope === "international" && isDomestic(item) && !/中美|美中|美国|欧盟|联合国|外交|关税|制裁|出口管制/i.test(text)) {
      return THEMES.find((theme) => theme.id === "domestic-public") ?? matched;
    }
    return matched;
  }
  if (isDomestic(item)) return THEMES.find((theme) => theme.id === "domestic-public") ?? THEMES[0];
  return THEMES.find((theme) => theme.id === "tech-industry") ?? THEMES[0];
}

function sourceWeight(sourceName: string) {
  if (/OpenAI|DeepMind|Google|NVIDIA|GitHub|Cloudflare|联合国|BBC|纽约时报|CNBC|Reuters|The Verge|TechCrunch|MIT|新华社|中国新闻网|IT之家/i.test(sourceName)) return 12;
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

function isAiRadarScope(scope: BriefingEventScope) {
  return scope === "ai_tech";
}

function diversifyEvents(events: BriefingEventClusterDTO[], limit: number) {
  const selected: BriefingEventClusterDTO[] = [];
  const selectedIds = new Set<string>();
  const sourceUse = new Map<string, number>();

  function scopeCount(scope: BriefingEventScope) {
    return selected.filter((event) => event.scope === scope).length;
  }

  function aiCount() {
    return selected.filter((event) => isAiRadarScope(event.scope)).length;
  }

  function canUse(event: BriefingEventClusterDTO, options?: { relaxSource?: boolean }) {
    if (selectedIds.has(event.id)) return false;
    if (event.scope === "international" && scopeCount("international") >= 2) return false;
    if (event.scope === "domestic" && scopeCount("domestic") >= 2) return false;
    if (event.scope === "market" && scopeCount("market") >= 1) return false;
    if (isAiRadarScope(event.scope) && aiCount() >= 5) return false;
    if (options?.relaxSource) return true;
    const primarySource = event.sourceNames[0] ?? "";
    const maxPerSource = isAiRadarScope(event.scope) ? 3 : 2;
    return (sourceUse.get(primarySource) ?? 0) < maxPerSource;
  }

  function add(event: BriefingEventClusterDTO | undefined, options?: { relaxSource?: boolean }) {
    if (!event || !canUse(event, options) || selected.length >= limit) return false;
    selected.push(event);
    selectedIds.add(event.id);
    const primarySource = event.sourceNames[0] ?? "";
    sourceUse.set(primarySource, (sourceUse.get(primarySource) ?? 0) + 1);
    return true;
  }

  function addFrom(bucket: BriefingEventClusterDTO[], targetCount: number, options?: { relaxSource?: boolean }) {
    for (const event of bucket) {
      if (selected.length >= limit || targetCount <= 0) return;
      if (add(event, options)) targetCount -= 1;
    }
  }

  const international = events.filter((event) => event.scope === "international" && event.impactScore >= 68);
  const domestic = events.filter((event) => event.scope === "domestic" && event.impactScore >= 68);
  const aiTech = events.filter((event) => isAiRadarScope(event.scope) && event.impactScore >= 64);

  addFrom(international, Math.min(2, international.length), { relaxSource: true });
  addFrom(domestic, Math.min(2, domestic.length), { relaxSource: true });
  addFrom(aiTech, Math.min(3, aiTech.length), { relaxSource: true });

  for (const event of events) add(event);
  return selected
    .sort((a, b) => b.impactScore - a.impactScore || new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime())
    .slice(0, limit);
}

export function buildBriefingEventRadar(items: NewsItemDTO[], limit = 8): BriefingEventClusterDTO[] {
  const sourceItems = items
    .filter((item) => !isLowValueCommunityItem({
      sourceName: item.sourceName,
      title: item.title,
      excerpt: item.excerpt,
      summary: item.aiSummary,
      detailText: item.detailText,
    }))
    .slice(0, 120);

  const clusters: ClusterDraft[] = [];

  for (const item of sourceItems) {
    const theme = themeFor(item);
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

  const ranked = clusters
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
        scopeLabel: cluster.theme.label || SCOPE_LABEL[cluster.theme.scope],
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
    .sort((a, b) => b.impactScore - a.impactScore || new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());

  return diversifyEvents(ranked, limit);
}
