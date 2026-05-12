import { prisma } from "@/lib/prisma";
import type { BriefingThinkingInsight, NewsItemDTO } from "./types";

type ThinkingTheme = {
  id: string;
  label: string;
  match: RegExp;
  impact: string;
  thesis: string;
  question: string;
  tags: string[];
  weight: number;
};

type StrategicSignal = {
  id: string;
  label: string;
  themeId: string;
  match: (text: string) => boolean;
  impact: string;
  thesis: string;
  question: string;
  tags: string[];
  weight: number;
};

const THEMES: ThinkingTheme[] = [
  {
    id: "chip-policy",
    label: "算力与芯片",
    match: /芯片|半导体|英伟达|NVIDIA|GPU|算力|出口管制|制裁|关税|黄仁勋|供应链/i,
    impact: "高影响",
    thesis: "这类事件往往不只是公司新闻，而是在测试政策边界、供应链重新定价和技术路线切换。",
    question: "如果政策口径松动或收紧，哪些产业链环节会先反应，哪些判断需要提前修正？",
    tags: ["政策", "芯片", "供应链"],
    weight: 34,
  },
  {
    id: "ai-platform",
    label: "AI 平台变化",
    match: /OpenAI|DeepMind|Gemini|Claude|模型|智能体|Agent|大模型|推理|多模态|AI\s?搜索|AI\s?硬件|\bAI\b/i,
    impact: "结构变化",
    thesis: "AI 产品更新最值得看的不是功能点，而是它把用户入口、工作流和算力成本推向了哪里。",
    question: "这次变化是在增强现有工具，还是在重写一个新的入口？它会改变你的信息处理方式吗？",
    tags: ["AI", "产品入口", "工作流"],
    weight: 30,
  },
  {
    id: "capital-market",
    label: "资本与市场定价",
    match: /市场|股|财报|融资|并购|上市|债|利率|降息|通胀|美元|人民币|黄金|原油|订单|营收|利润|估值/i,
    impact: "定价信号",
    thesis: "市场类新闻的分析价值在于它透露资金偏好是否变化，而不是单日涨跌本身。",
    question: "资金是在押注长期结构，还是只是在交易短期情绪？这会影响哪些资产或行业判断？",
    tags: ["市场", "资本", "定价"],
    weight: 24,
  },
  {
    id: "security-risk",
    label: "安全与信任",
    match: /漏洞|攻击|泄露|勒索|安全|隐私|数据|后门|供应链攻击|合规|监管/i,
    impact: "风险外溢",
    thesis: "安全事件的关键不是单点事故，而是它会不会暴露一类基础设施或组织流程的系统性弱点。",
    question: "这件事是否说明某个常用技术栈、供应商或流程需要重新评估？",
    tags: ["安全", "信任", "风险"],
    weight: 28,
  },
  {
    id: "developer-shift",
    label: "开发者生态",
    match: /开源|GitHub|开发者|框架|云|数据库|架构|API|Linux|Cloudflare|Hacker News|工程|代码|编程/i,
    impact: "生态信号",
    thesis: "开发者生态里的高频变化，经常比大公司的发布会更早反映真实生产力迁移。",
    question: "这条变化是工具噪音，还是会改变团队协作、架构选择或个人工作效率？",
    tags: ["开发者", "架构", "工具链"],
    weight: 22,
  },
  {
    id: "public-opinion",
    label: "社会情绪与注意力",
    match: /热搜|热榜|舆论|微博|知乎|B站|社区|争议|用户|消费|教育|就业|人口|医疗/i,
    impact: "情绪信号",
    thesis: "热榜类内容本身很嘈杂，但当它和政策、商业或技术变化叠加时，会成为需求和风险的早期信号。",
    question: "这是短期注意力，还是一个真实需求/焦虑正在浮出水面？",
    tags: ["注意力", "需求", "社会情绪"],
    weight: 16,
  },
  {
    id: "geopolitics",
    label: "地缘与制度",
    match: /中美|美中|欧盟|俄罗斯|乌克兰|中东|联合国|总统|政府|外交|贸易|战争|冲突|选举|法案|监管|协议|关税|制裁/i,
    impact: "制度变量",
    thesis: "地缘新闻值得看的是制度约束是否变化，以及它会不会传导到技术、资本和供应链。",
    question: "这件事会改变谁的约束条件？它会不会影响后续产业政策或市场预期？",
    tags: ["地缘", "政策", "制度"],
    weight: 26,
  },
];

const HIGH_VALUE_SOURCE_RE =
  /联合国|ABC|BBC|CNBC|MarketWatch|Seeking Alpha|MIT|OpenAI|DeepMind|Google|TechCrunch|VentureBeat|InfoQ|极客公园|36氪|IT之家|Hacker News|GitHub|Cloudflare|Pragmatic|Stratechery/i;

const AI_CORE_RE =
  /OpenAI|Anthropic|Claude|DeepMind|Gemini|GPT|Sora|Llama|Meta AI|Qwen|通义|千问|Kimi|DeepSeek|豆包|混元|文心|GLM|大模型|模型|多模态|推理|智能体|Agent|AI\s?搜索|AI\s?助手|AI\s?硬件|AIGC|生成式|人工智能|\bAI\b/i;
const AI_MAJOR_EVENT_RE =
  /发布|推出|上线|升级|开源|闭源|收购|融资|估值|合作|接入|集成|监管|法案|出口|许可|禁令|漏洞|泄露|突破|训练|推理|数据中心|芯片|算力|launch|release|upgrade|open source|funding|raise|acquire|partnership|regulation|benchmark/i;
const AI_PLATFORM_RE =
  /OpenAI|Anthropic|Claude|DeepMind|Gemini|GPT|Sora|Llama|Meta AI|Qwen|通义|千问|Kimi|DeepSeek|豆包|混元|文心|GLM|模型|多模态|推理|智能体|Agent/i;
const AI_COMPUTE_RE =
  /NVIDIA|英伟达|黄仁勋|GPU|TPU|ASIC|H100|H200|B200|GB200|Blackwell|Rubin|芯片|半导体|算力|数据中心|服务器|HBM/i;
const AI_DISTRIBUTION_RE =
  /搜索|浏览器|办公|Office|Windows|Android|iOS|手机|汽车|眼镜|硬件|助手|电商|淘宝|购物|社交|入口|接入|集成|操作系统|家电/i;
const AI_CAPITAL_RE =
  /融资|估值|财报|营收|亏损|利润|成本|烧钱|并购|上市|资本|投资|funding|valuation|revenue|profit|loss|acquisition/i;
const AI_SECURITY_RE =
  /安全|隐私|数据|漏洞|攻击|泄露|版权|合规|监管|法案|水印|深度伪造|deepfake|privacy|security|copyright|regulation/i;
const CONSUMER_NOISE_RE =
  /代言|明星|预售|售价|配色|优惠|促销|门店|排行榜|综艺|票房|手机|汽车|家电|冰箱/i;

const STRATEGIC_SIGNALS: StrategicSignal[] = [
  {
    id: "frontier-ai-platform",
    label: "前沿 AI 平台",
    themeId: "ai-platform",
    match: (text) => AI_PLATFORM_RE.test(text) && AI_MAJOR_EVENT_RE.test(text),
    impact: "核心变化",
    thesis: "前沿模型和平台变化会直接影响信息入口、开发方式、应用形态和算力需求。",
    question: "这次变化是在提升单点能力，还是在改变用户进入 AI 的方式？哪些工作流会被重新组织？",
    tags: ["AI模型", "平台", "工作流", "入口"],
    weight: 44,
  },
  {
    id: "ai-compute-supply",
    label: "AI 算力与芯片",
    themeId: "chip-policy",
    match: (text) => AI_COMPUTE_RE.test(text) && /\bAI\b|人工智能|模型|数据中心|云|出口|许可|供应|订单|产能|训练|推理|算力/i.test(text),
    impact: "高影响",
    thesis: "算力供给和芯片约束决定了 AI 应用扩张速度，也会传导到云厂商、模型公司和终端产品。",
    question: "这条变化会让算力更便宜、更稀缺，还是让某类模型或产品先获得优势？",
    tags: ["算力", "芯片", "云", "AI基础设施"],
    weight: 40,
  },
  {
    id: "ai-product-distribution",
    label: "AI 产品入口",
    themeId: "ai-platform",
    match: (text) => AI_CORE_RE.test(text) && AI_DISTRIBUTION_RE.test(text) && /发布|上线|接入|集成|升级|开放|推出/i.test(text),
    impact: "入口变化",
    thesis: "AI 真正产生影响时，往往会先嵌入搜索、办公、手机、车、硬件或交易场景，改变用户默认路径。",
    question: "它是在给旧产品加功能，还是在抢占新的日常入口？用户会不会因此少打开一个原有应用？",
    tags: ["AI产品", "入口", "场景", "用户路径"],
    weight: 34,
  },
  {
    id: "ai-capital-economics",
    label: "AI 资本与成本",
    themeId: "capital-market",
    match: (text) => AI_CORE_RE.test(text) && AI_CAPITAL_RE.test(text),
    impact: "定价信号",
    thesis: "AI 资本新闻的重点不是融资数字，而是收入、算力成本、获客成本和估值预期是否匹配。",
    question: "资金是在买真实增长，还是在延长烧钱窗口？这会影响哪些公司或赛道的生存节奏？",
    tags: ["AI融资", "成本", "估值", "商业化"],
    weight: 36,
  },
  {
    id: "ai-security-governance",
    label: "AI 安全与治理",
    themeId: "security-risk",
    match: (text) => AI_CORE_RE.test(text) && AI_SECURITY_RE.test(text),
    impact: "风险外溢",
    thesis: "AI 安全和治理事件会影响产品边界、数据使用、企业采购和监管预期。",
    question: "这件事会不会改变企业使用 AI 的风险判断，或者迫使平台调整能力开放方式？",
    tags: ["AI安全", "治理", "隐私", "合规"],
    weight: 34,
  },
  {
    id: "ai-developer-shift",
    label: "AI 开发生态",
    themeId: "developer-shift",
    match: (text) => AI_CORE_RE.test(text) && /开发者|GitHub|开源|API|SDK|框架|数据库|云|工具|代码|编程|Agent/i.test(text),
    impact: "生态信号",
    thesis: "开发者生态的变化经常比发布会更早说明 AI 生产力会落到哪里。",
    question: "这会让个人和团队更快构建产品，还是把依赖进一步推向某个平台？",
    tags: ["开发者", "工具链", "AI工程", "生态"],
    weight: 32,
  },
  {
    id: "trump-china-chip",
    label: "AI 芯片政策边界",
    themeId: "chip-policy",
    match: (text) => /特朗普|Trump/i.test(text)
      && /访华|会晤|中国|China|北京|习近平|Xi/i.test(text)
      && /黄仁勋|Jensen|NVIDIA|英伟达|H200|Blackwell|Rubin|GPU|芯片|\bAI\b|人工智能|出口|许可|制裁|管制|license|export|curb/i.test(text),
    impact: "战略信号",
    thesis: "这不是单纯的外交新闻，而是外交议程、AI 算力出口、企业游说和技术边界同时出现的复合信号。",
    question: "如果议程里出现 AI、芯片或出口许可口径变化，是否意味着芯片管制从“封锁”转向“可控放行”？",
    tags: ["AI芯片", "政策边界", "英伟达", "出口许可"],
    weight: 28,
  },
  {
    id: "ai-chip-license",
    label: "AI 芯片出口许可",
    themeId: "chip-policy",
    match: (text) => /H200|Blackwell|Rubin|NVIDIA|英伟达|黄仁勋|Jensen|GPU/i.test(text)
      && /中国|China|出口|许可|license|制裁|管制|curb|market share|份额/i.test(text),
    impact: "高影响",
    thesis: "AI 芯片出口许可是算力供给、监管、企业收入和国产替代之间的交叉点。",
    question: "这条消息是在说明限制继续收紧，还是企业正在为某种豁免或新型号出口铺路？",
    tags: ["AI芯片", "出口许可", "算力", "国产替代"],
    weight: 30,
  },
];

const SIGNAL_PRIORITY: Record<string, number> = {
  "trump-china-chip": 90,
  "ai-chip-license": 84,
  "ai-capital-economics": 83,
  "ai-compute-supply": 82,
  "ai-product-distribution": 78,
  "ai-security-governance": 74,
  "frontier-ai-platform": 73,
  "ai-developer-shift": 72,
};

function signalForText(text: string) {
  return STRATEGIC_SIGNALS
    .filter((signal) => signal.match(text))
    .sort((a, b) => (SIGNAL_PRIORITY[b.id] ?? 0) - (SIGNAL_PRIORITY[a.id] ?? 0) || b.weight - a.weight)[0];
}

function normalizeText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function shortTitle(input: string, max = 42) {
  const text = normalizeText(input);
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function keywordCandidates(input: string) {
  const text = normalizeText(input);
  const zh = text.match(/[\u4e00-\u9fa5]{2,6}/g) ?? [];
  const en = text.match(/[A-Za-z][A-Za-z0-9.+-]{2,}/g) ?? [];
  return [...zh, ...en]
    .map((item) => item.trim())
    .filter((item) => item.length >= 2 && !/这个|那个|今天|最近|笔记|内容|一个|自己|正在|可以|已经/.test(item))
    .slice(0, 80);
}

function overlapScore(text: string, habitKeywords: string[]) {
  if (habitKeywords.length === 0) return 0;
  const haystack = text.toLowerCase();
  const matched = habitKeywords.filter((keyword) => haystack.includes(keyword.toLowerCase()));
  return Math.min(18, matched.length * 4);
}

function aiImpactScore(item: NewsItemDTO, text: string) {
  const isAiCore = AI_CORE_RE.test(text);
  const isMajorEvent = AI_MAJOR_EVENT_RE.test(text);
  let score = 0;

  if (item.category === "ai_tech") score += 14;
  if (isAiCore) score += 24;
  if (isMajorEvent) score += 12;
  if (AI_PLATFORM_RE.test(text)) score += 14;
  if (AI_COMPUTE_RE.test(text)) score += 12;
  if (AI_CAPITAL_RE.test(text)) score += 8;
  if (AI_SECURITY_RE.test(text)) score += 8;
  if (AI_DISTRIBUTION_RE.test(text) && isAiCore) score += 7;
  if (CONSUMER_NOISE_RE.test(text) && !isAiCore) score -= 20;
  if (/代言|明星|配色|优惠|促销/.test(text)) score -= 8;

  return Math.max(-24, Math.min(56, score));
}

function bestTheme(item: NewsItemDTO) {
  const text = `${item.title} ${item.aiSummary ?? ""} ${item.detailText} ${item.aiTags.join(" ")}`;
  const signal = signalForText(text);
  if (signal) {
    return {
      theme: THEMES.find((theme) => theme.id === signal.themeId) ?? THEMES[0],
      matched: true,
      signal,
    };
  }

  let selected = THEMES[THEMES.length - 1];
  let score = -Infinity;
  for (const theme of THEMES) {
    const matched = theme.match.test(text);
    const nextScore = (matched ? theme.weight : 0) + item.aiTags.filter((tag) => theme.match.test(tag)).length * 5;
    if (nextScore > score) {
      score = nextScore;
      selected = theme;
    }
  }
  return { theme: selected, matched: score > 0, signal: undefined };
}

async function getHabitSignals(userId: string) {
  if (!process.env.DATABASE_URL) return [];

  const [memories, notes] = await Promise.all([
    prisma.memoryFact.findMany({
      where: { userId, isActive: true },
      orderBy: [{ updatedAt: "desc" }],
      take: 10,
      select: { content: true, type: true },
    }),
    prisma.note.findMany({
      where: { userId, deletedAt: null, isArchived: false },
      include: { tags: { include: { tag: true } }, project: true },
      orderBy: [{ updatedAt: "desc" }],
      take: 24,
    }),
  ]);

  const rawSignals = [
    ...memories.map((item) => item.content),
    ...notes.flatMap((note) => [
      note.title,
      note.excerpt,
      note.project?.name ?? "",
      ...note.tags.map((item) => item.tag.name),
    ]),
  ].filter(Boolean);

  const counts = new Map<string, number>();
  for (const signal of rawSignals) {
    for (const keyword of keywordCandidates(signal)) {
      counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([keyword]) => keyword)
    .slice(0, 18);
}

export async function getBriefingThinkingInsights(
  userId: string,
  items: NewsItemDTO[],
  limit = 7,
): Promise<BriefingThinkingInsight[]> {
  const targetCount = Math.max(7, Math.min(limit, 8));
  const habitSignals = await getHabitSignals(userId).catch(() => []);
  const candidates = items.map((item) => {
    const text = `${item.title} ${item.aiSummary ?? ""} ${item.detailText} ${item.sourceName} ${item.aiTags.join(" ")}`;
    const { theme, signal } = bestTheme(item);
    const qualityBoost = (item.aiScore ?? 0.45) * 36;
    const depth = Math.min(12, Math.floor(item.detailText.length / 120));
    const sourceBoost = HIGH_VALUE_SOURCE_RE.test(item.sourceName) ? 8 : 0;
    const habitBoost = overlapScore(text, habitSignals);
    const recencyHours = Math.max(0, (Date.now() - new Date(item.publishedAt).getTime()) / 3_600_000);
    const recencyBoost = Math.max(0, 14 - recencyHours / 2);
    const themeBoost = theme.weight;
    const signalBoost = signal?.weight ?? 0;
    const impactBoost = aiImpactScore(item, text);

    return {
      item,
      theme,
      signal,
      score: qualityBoost + depth + sourceBoost + habitBoost + recencyBoost + themeBoost + signalBoost + impactBoost,
      habitMatches: habitSignals.filter((signal) => text.toLowerCase().includes(signal.toLowerCase())).slice(0, 3),
    };
  });

  const selected: typeof candidates = [];
  const usedThemes = new Set<string>();
  const usedTitles = new Set<string>();

  for (const candidate of candidates.sort((a, b) => b.score - a.score)) {
    const titleKey = candidate.item.title.slice(0, 18);
    if (usedTitles.has(titleKey)) continue;
    if (!candidate.signal && usedThemes.has(candidate.theme.id) && selected.length < 3) continue;
    usedThemes.add(candidate.theme.id);
    usedTitles.add(titleKey);
    selected.push(candidate);
    if (selected.length >= targetCount) break;
  }

  return selected.slice(0, targetCount).map((candidate) => {
    const signal = candidate.signal;
    const sourceTitles = [candidate.item.title, ...candidate.item.aiKeyPoints].map((item) => shortTitle(item, 54)).slice(0, 3);
    const habitMatches = candidate.habitMatches.length > 0
      ? candidate.habitMatches
      : habitSignals.slice(0, 2);
    return {
      id: `${signal?.id ?? candidate.theme.id}-${candidate.item.id}`,
      title: shortTitle(candidate.item.title, 46),
      thesis: signal?.thesis ?? candidate.theme.thesis,
      question: signal?.question ?? candidate.theme.question,
      whyItMatters: `我会先按“${signal?.label ?? candidate.theme.label}”来思考：${shortTitle(candidate.item.aiSummary || candidate.item.detailText || candidate.item.title, 120)}`,
      impactLabel: signal?.impact ?? candidate.theme.impact,
      confidence: Math.max(62, Math.min(96, Math.round(56 + candidate.score * 0.18))),
      sourceTitles,
      habitSignals: habitMatches.slice(0, 3),
      tags: [...(signal?.tags ?? candidate.theme.tags), ...candidate.item.aiTags].slice(0, 5),
    };
  });
}
