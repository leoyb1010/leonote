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

const THEMES: ThinkingTheme[] = [
  {
    id: "chip-policy",
    label: "芯片与供应链",
    match: /芯片|半导体|英伟达|NVIDIA|GPU|算力|出口管制|制裁|关税|黄仁勋|特朗普|访华|供应链/i,
    impact: "高影响",
    thesis: "这类事件往往不只是公司新闻，而是在测试政策边界、供应链重新定价和技术路线切换。",
    question: "如果政策口径松动或收紧，哪些产业链环节会先反应，哪些判断需要提前修正？",
    tags: ["政策", "芯片", "供应链"],
    weight: 34,
  },
  {
    id: "ai-platform",
    label: "AI 平台变化",
    match: /OpenAI|DeepMind|Gemini|Claude|模型|智能体|Agent|大模型|推理|多模态|AI\s?搜索|AI\s?硬件|AI/i,
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
    match: /中国|美国|欧盟|俄罗斯|乌克兰|中东|联合国|总统|政府|外交|贸易|战争|冲突|选举|法案|监管|协议/i,
    impact: "制度变量",
    thesis: "地缘新闻值得看的是制度约束是否变化，以及它会不会传导到技术、资本和供应链。",
    question: "这件事会改变谁的约束条件？它会不会影响后续产业政策或市场预期？",
    tags: ["地缘", "政策", "制度"],
    weight: 26,
  },
];

const HIGH_VALUE_SOURCE_RE =
  /联合国|CNBC|MarketWatch|Seeking Alpha|MIT|OpenAI|DeepMind|Google|TechCrunch|VentureBeat|InfoQ|极客公园|36氪|IT之家|Hacker News|GitHub|Cloudflare|Pragmatic|Stratechery/i;

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

function bestTheme(item: NewsItemDTO) {
  const text = `${item.title} ${item.aiSummary ?? ""} ${item.detailText} ${item.aiTags.join(" ")}`;
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
  return { theme: selected, matched: score > 0 };
}

async function getHabitSignals(userId: string) {
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
  limit = 5,
): Promise<BriefingThinkingInsight[]> {
  const habitSignals = await getHabitSignals(userId).catch(() => []);
  const candidates = items.map((item) => {
    const { theme } = bestTheme(item);
    const text = `${item.title} ${item.aiSummary ?? ""} ${item.detailText} ${item.sourceName}`;
    const base = (item.aiScore ?? 0.45) * 100;
    const depth = Math.min(16, Math.floor(item.detailText.length / 110));
    const sourceBoost = HIGH_VALUE_SOURCE_RE.test(item.sourceName) ? 10 : 0;
    const habitBoost = overlapScore(text, habitSignals);
    const recencyHours = Math.max(0, (Date.now() - new Date(item.publishedAt).getTime()) / 3_600_000);
    const recencyBoost = Math.max(0, 12 - recencyHours / 2);
    const themeBoost = theme.weight;

    return {
      item,
      theme,
      score: base + depth + sourceBoost + habitBoost + recencyBoost + themeBoost,
      habitMatches: habitSignals.filter((signal) => text.toLowerCase().includes(signal.toLowerCase())).slice(0, 3),
    };
  });

  const selected: typeof candidates = [];
  const usedThemes = new Set<string>();
  const usedTitles = new Set<string>();

  for (const candidate of candidates.sort((a, b) => b.score - a.score)) {
    const titleKey = candidate.item.title.slice(0, 18);
    if (usedTitles.has(titleKey)) continue;
    if (usedThemes.has(candidate.theme.id) && selected.length < 3) continue;
    usedThemes.add(candidate.theme.id);
    usedTitles.add(titleKey);
    selected.push(candidate);
    if (selected.length >= limit) break;
  }

  return selected.slice(0, Math.max(3, Math.min(limit, 5))).map((candidate) => {
    const sourceTitles = [candidate.item.title, ...candidate.item.aiKeyPoints].map((item) => shortTitle(item, 54)).slice(0, 3);
    const habitMatches = candidate.habitMatches.length > 0
      ? candidate.habitMatches
      : habitSignals.slice(0, 2);
    return {
      id: `${candidate.theme.id}-${candidate.item.id}`,
      title: `${candidate.theme.label}：${shortTitle(candidate.item.title, 34)}`,
      thesis: candidate.theme.thesis,
      question: candidate.theme.question,
      whyItMatters: `我会把它放进“${candidate.theme.label}”这条线索里看：${shortTitle(candidate.item.aiSummary || candidate.item.detailText || candidate.item.title, 120)}`,
      impactLabel: candidate.theme.impact,
      confidence: Math.max(62, Math.min(96, Math.round(candidate.score))),
      sourceTitles,
      habitSignals: habitMatches.slice(0, 3),
      tags: [...candidate.theme.tags, ...candidate.item.aiTags].slice(0, 5),
    };
  });
}
