import Parser from "rss-parser";
import { sanitizeBriefingText, stableExternalId } from "./normalize";
import { needsTranslation, translateBatch } from "./translate";
import type { HoroscopeDTO } from "./types";

type HoroscopeProfile = {
  id: HoroscopeDTO["id"];
  name: string;
  relation: string;
  signName: string;
  signKey: HoroscopeDTO["signKey"];
  feedUrl: string;
  apiUrl: string;
  webUrl: string;
  astrologyUrl: string;
};

type HoroscopeRssItem = {
  title?: string;
  link?: string;
  content?: string;
  contentSnippet?: string;
  summary?: string;
  pubDate?: string;
  isoDate?: string;
};

type ThemeKey = "money" | "work" | "relationship" | "home" | "energy" | "learning";

const FEED_TIMEOUT_MS = 12_000;
const PARTIAL_CACHE_TTL_MS = 10 * 60 * 1000;
let cachedHoroscopes: HoroscopeDTO[] | null = null;
let cachedDay: string | null = null;
let cachedAt = 0;

const PROFILES: HoroscopeProfile[] = [
  {
    id: "leo",
    name: "Leo · 袁博",
    relation: "我",
    signName: "天秤座",
    signKey: "libra",
    feedUrl: "https://feeds.feedburner.com/AstroSageLibra",
    apiUrl: "https://freehoroscopeapi.com/api/v1/get-horoscope/daily?sign=libra&day=today",
    webUrl: "https://www.horoscope.com/us/horoscopes/general/horoscope-general-daily-today.aspx?sign=7",
    astrologyUrl: "https://www.astrology.com/horoscope/daily/libra.html",
  },
  {
    id: "ellen",
    name: "Ellen · 张云",
    relation: "老婆",
    signName: "双鱼座",
    signKey: "pisces",
    feedUrl: "https://feeds.feedburner.com/AstroSagePisces",
    apiUrl: "https://freehoroscopeapi.com/api/v1/get-horoscope/daily?sign=pisces&day=today",
    webUrl: "https://www.horoscope.com/us/horoscopes/general/horoscope-general-daily-today.aspx?sign=12",
    astrologyUrl: "https://www.astrology.com/horoscope/daily/pisces.html",
  },
  {
    id: "bubu",
    name: "BuBu · 袁晨希",
    relation: "女儿",
    signName: "双子座",
    signKey: "gemini",
    feedUrl: "https://feeds.feedburner.com/AstroSageGemini",
    apiUrl: "https://freehoroscopeapi.com/api/v1/get-horoscope/daily?sign=gemini&day=today",
    webUrl: "https://www.horoscope.com/us/horoscopes/general/horoscope-general-daily-today.aspx?sign=3",
    astrologyUrl: "https://www.astrology.com/horoscope/daily/gemini.html",
  },
];

const parser = new Parser<Record<string, unknown>, HoroscopeRssItem>({
  headers: {
    Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    "User-Agent": "Mozilla/5.0 (compatible; LeonoteBriefing/1.0; +https://leonote.local)",
  },
});

const POSITIVE_RE = /\b(good|great|excellent|wonderful|amazing|best|better|success|successful|gain|benefit|beneficial|happy|happiness|joy|joyful|favorable|positive|support|supportive|opportunity|progress|profit|romance|love|energy|confidence|confident|luck|lucky|reward|improve|improvement|growth|achievement|achieve|creative|talent|talented|new|learn|strong|stronger|enjoy|enjoyable|peaceful|calm|harmony|harmonious|trust|trusted|open|clear|clarity|bright|brighter|hope|hopeful|inspire|inspired|freedom|free|smart|wise|wisdom|powerful|thriving|thrive|smooth|easier|comfortable|relax|relaxed|balanced|focus|focused|productive|accomplish|celebrate|win|winning|exciting|refresh|renewed|uplift|uplifting|boost|boosted|encourage|encouraged|fulfill|fulfilled|abundance|prosper|vitality|wellbeing|well-being)\b/gi;
const CAUTION_RE = /\b(avoid|caution|careful|stress|stressed|problem|loss|conflict|delay|trouble|issue|worry|tension|argument|expense|health|pressure|risk|obstacle|dispute|necessary|difficult|hardship|struggle|crisis|danger|threat|harm|hurt|pain|fail|failure|exhaust|overwhelm|frustrat|anxious|anxiety|regret|disappoint|neglect|ignore|reckless|impulsive|volatile|chaos|chaotic|toxic|destructive|lonely|isolat|stuck|stagnan|decline|deteriorat|worse|worst|burden|heavy)\b/gi;

const THEME_PATTERNS: Record<ThemeKey, RegExp> = {
  money: /\b(money|financial|finance|investment|invest|purchase|cost|resources|earn|income|profit|expense|budget|save|spending)\b/gi,
  work: /\b(work|career|project|task|responsibility|professional|business|meeting|plan|decision|opportunity|organized)\b/gi,
  relationship: /\b(friend|family|partner|relationship|relationships|romance|love|communicat|conversation|misunderstanding|interactions|supportive|social|people)\b/gi,
  home: /\b(home|house|domestic|errand|neighborhood|clothes|object|purchase)\b/gi,
  energy: /\b(energy|health|rest|stress|mood|emotion|balance|pressure|confidence|overwhelmed|flexible|adapt)\b/gi,
  learning: /\b(creative|talent|learn|study|idea|write|express|explore|skill|knowledge|research|news|open-minded)\b/gi,
};

const THEME_SENTENCES: Record<ThemeKey, string[]> = {
  money: [
    "今天适合把投入、成本和回报看清楚，再决定要不要推进。",
    "财务与资源分配值得多看一眼，小额选择也先留出余地。",
    "如果出现新的机会，先问清楚时间、精力和金钱各要付出多少。",
  ],
  work: [
    "工作上适合先整理优先级，把真正能推进结果的事项放到前面。",
    "今天适合做清晰决策，但别急着一次性把所有方案拍死。",
    "项目推进可以更务实一点，先拿到关键事实，再安排下一步。",
  ],
  relationship: [
    "关系沟通里少一点猜测，多一点直接确认，会让事情顺很多。",
    "今天适合和可信的人交换意见，外部视角能帮你看见盲区。",
    "遇到分歧时先稳定语气，留出讨论空间比立刻定论更有用。",
  ],
  home: [
    "日常安排里可能有些零散事务，适合顺手清掉，不要拖成负担。",
    "家庭和生活细节会占一些注意力，提前安排能减少临时打断。",
    "今天适合把身边环境整理得更顺手，让后续行动少一点阻力。",
  ],
  energy: [
    "状态管理比硬扛更重要，给自己留一点缓冲，判断会更稳。",
    "今天先照顾节奏和情绪，再处理复杂沟通，效果会更好。",
    "精力不是无限的，把注意力放在少数关键处会更舒服。",
  ],
  learning: [
    "好奇心会带来新线索，适合学习、表达和探索一个小问题。",
    "创意和表达力比较活跃，可以把新想法先记录下来再筛选。",
    "今天适合尝试新的知识输入，但要避免同时打开太多方向。",
  ],
};

const DEFAULT_SOURCE_THEMES: Record<HoroscopeDTO["signKey"], ThemeKey[]> = {
  libra: ["relationship", "money", "energy", "work"],
  pisces: ["relationship", "home", "energy", "work"],
  gemini: ["learning", "work", "relationship", "energy"],
};

export type HoroscopeSummaryProfile = Pick<HoroscopeProfile, "id" | "signKey">;

type FreeHoroscopeApiResponse = {
  data?: {
    date?: string;
    horoscope?: string;
    period?: string;
    sign?: string;
  };
};

function shanghaiDayKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function shanghaiDateLabel(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "long",
    day: "numeric",
  }).format(date);
}

function seededIndex(seed: string, length: number, offset = 0) {
  if (length <= 1) return 0;
  const hex = seed.slice(offset, offset + 6) || seed;
  return Number.parseInt(hex, 16) % length;
}

function clampStars(value: number) {
  return Math.max(1, Math.min(5, Math.round(value)));
}

function scoreFromText(text: string) {
  const positive = text.match(POSITIVE_RE)?.length ?? 0;
  const caution = text.match(CAUTION_RE)?.length ?? 0;
  if (positive === 0 && caution === 0) return 3;
  // Positive words boost more; caution words penalize less.
  // Net-positive text => 4-5 stars; balanced => 3 stars; net-negative => 2 stars.
  const posScore = Math.min(5, positive) * 0.5;
  const cautScore = Math.min(3, caution) * 0.45;
  return clampStars(3 + posScore - cautScore);
}

function parseSourceDate(input: string | undefined) {
  if (!input) return null;
  const date = new Date(input);
  return Number.isFinite(date.getTime()) ? date : null;
}

function parseCompactDate(input: string | undefined) {
  if (!input || !/^\d{8}$/.test(input)) return null;
  const year = Number.parseInt(input.slice(0, 4), 10);
  const month = Number.parseInt(input.slice(4, 6), 10) - 1;
  const day = Number.parseInt(input.slice(6, 8), 10);
  return new Date(Date.UTC(year, month, day, 12));
}

function parseSourceDay(input: string | undefined) {
  if (!input) return null;
  if (/^\d{8}$/.test(input)) return parseCompactDate(input);
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return new Date(`${input}T12:00:00Z`);
  return parseSourceDate(input);
}

function isCurrentSourceDate(date: Date | null): date is Date {
  if (!date) return false;
  return shanghaiDayKey(date) === shanghaiDayKey();
}

function unescapeJsString(input: string) {
  try {
    return JSON.parse(`"${input}"`) as string;
  } catch {
    return input.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\'/g, "'");
  }
}

function extractHoroscopeComPayload(html: string) {
  const textMatch = html.match(/horoscopeText:\s*"((?:\\.|[^"\\])*)"/);
  const dateMatch = html.match(/horoscopeDate:\s*"([\d-]{8,10})"/);
  const text = textMatch ? sanitizeBriefingText(unescapeJsString(textMatch[1]), 720) : "";
  const sourceDate = parseSourceDay(dateMatch?.[1]);
  return { text, sourceDate };
}

function stripHtml(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAstrologyComPayload(html: string) {
  const contentMatch = html.match(/<div id="content">\s*([\s\S]*?)\s*<\/div>/i);
  const dateMatch = html.match(/<span id="content-date">([^<]+)<\/span>/i);
  const text = contentMatch ? sanitizeBriefingText(stripHtml(contentMatch[1]), 720) : "";
  const sourceDate = parseSourceDay(dateMatch?.[1]);
  return { text, sourceDate };
}

function detectThemes(text: string, profile: HoroscopeSummaryProfile) {
  const themes = (Object.entries(THEME_PATTERNS) as Array<[ThemeKey, RegExp]>)
    .map(([theme, pattern]) => ({
      theme,
      count: text.match(pattern)?.length ?? 0,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((item) => item.theme);

  if (themes.length > 0) return themes;
  return DEFAULT_SOURCE_THEMES[profile.signKey];
}

type SignalRule = {
  key: string;
  match: RegExp;
  sentence: string;
};

const SOURCE_SIGNAL_RULES: SignalRule[] = [
  {
    key: "relationship-talk",
    match: /relationship|relationships|communication|conversation|communicat|partner|friends|friend|listening|compromise|harmony|love|admirer|dating/i,
    sentence: "关系与沟通是主线，表达前先听清对方立场，分歧里先找可接受的共识",
  },
  {
    key: "priorities-plan",
    match: /priorit|priority|priorities|plan|goals?|achieve|organized|routine|focus|one thing at a time/i,
    sentence: "适合重新排优先级，把目标、计划和日常节奏整理清楚后再推进",
  },
  {
    key: "restless-new",
    match: /restless|new hobby|activity|try something new|adventure|whimsy|invitation|trip|special group|fun/i,
    sentence: "好奇心和新鲜感会被放大，可以尝试新活动，但别让兴奋打乱节奏",
  },
  {
    key: "unexpected-news",
    match: /unexpected news|surprise visit|think on your feet|prepared|offer/i,
    sentence: "可能出现临时消息或意外邀约，先稳住节奏，再快速判断要不要接住",
  },
  {
    key: "clarity-confidence",
    match: /clarity|confidence|truth|analytical|fog|clear|sunny|reliable|understood|appreciated/i,
    sentence: "判断力和安全感需要校准，别只靠猜测，先把事实和感受分开看",
  },
  {
    key: "emotion-home",
    match: /emotion|feelings|home|family|domestic|relaxation|safe relationships|self-reflection|change/i,
    sentence: "情绪和家庭关系值得放慢处理，透明表达比憋着更容易带来修复",
  },
  {
    key: "writing-learning",
    match: /words|writing|letter|profile|educational|learn|spiritually|views|ideas|express/i,
    sentence: "表达、学习和文字相关的行动更顺手，适合把想法说清楚或写下来",
  },
];

export function buildSourceDrivenChineseSummary(text: string, profile: HoroscopeSummaryProfile, sourceDate: Date | null) {
  const clean = sanitizeBriefingText(text, 720);
  const matched: string[] = [];
  const used = new Set<string>();
  for (const rule of SOURCE_SIGNAL_RULES) {
    if (!rule.match.test(clean) || used.has(rule.key)) continue;
    used.add(rule.key);
    matched.push(rule.sentence);
    if (matched.length >= 2) break;
  }

  if (matched.length === 0) {
    const themes = detectThemes(clean, profile).slice(0, 2);
    const seed = stableExternalId(`${shanghaiDayKey()}-${profile.id}-${clean.slice(0, 220)}`);
    matched.push(...themes.map((theme, index) => {
      const pool = THEME_SENTENCES[theme];
      return pool[seededIndex(seed, pool.length, index * 6)];
    }));
  }

  const datePrefix = sourceDate ? `${shanghaiDateLabel(sourceDate)}重点：` : "今日重点：";
  return sanitizeBriefingText(`${datePrefix}${matched.join("；")}。`, 180);
}

function hasReadableChinese(text: string) {
  return (text.match(/[\u4e00-\u9fff]/g)?.length ?? 0) >= 8;
}

function canAttemptAiTranslation() {
  return Boolean(process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.DATABASE_URL);
}

async function toChineseDisplaySummary(text: string, profile: HoroscopeProfile, sourceDate: Date | null) {
  const clean = sanitizeBriefingText(text, 720);
  if (!clean) return "";
  if (!needsTranslation(clean) && hasReadableChinese(clean)) return sanitizeBriefingText(clean, 150);

  if (canAttemptAiTranslation()) {
    const [translated] = await translateBatch([clean]);
    const translatedClean = sanitizeBriefingText(translated || "", 180);
    if (hasReadableChinese(translatedClean)) return translatedClean;
  }

  return buildSourceDrivenChineseSummary(clean, profile, sourceDate);
}

async function fetchWithTimeout(url: string, accept: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: accept,
        "User-Agent": "Mozilla/5.0 (compatible; LeonoteBriefing/1.0; +https://leonote.local)",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Horoscope source failed: ${res.status}`);
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchFeed(feedUrl: string) {
  const xml = await fetchWithTimeout(feedUrl, "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8");
  return parser.parseString(xml);
}

async function fetchFreeHoroscopeApi(profile: HoroscopeProfile): Promise<HoroscopeDTO | null> {
  const payload = await fetchWithTimeout(profile.apiUrl, "application/json, text/plain;q=0.9, */*;q=0.8");
  let json: FreeHoroscopeApiResponse;
  try {
    json = JSON.parse(payload) as FreeHoroscopeApiResponse;
  } catch {
    return null;
  }
  const text = sanitizeBriefingText(json.data?.horoscope || "", 720);
  const sourceDate = parseSourceDay(json.data?.date);
  if (!text || !isCurrentSourceDate(sourceDate)) return null;
  const summary = await toChineseDisplaySummary(text, profile, sourceDate);
  if (!summary) return null;
  return {
    id: profile.id,
    name: profile.name,
    relation: profile.relation,
    signName: profile.signName,
    signKey: profile.signKey,
    stars: scoreFromText(text),
    summary,
    sourceName: "FreeHoroscopeAPI",
    sourceUrl: "https://freehoroscopeapi.com/",
    sourceDate: sourceDate.toISOString(),
    updatedAt: new Date().toISOString(),
    isFallback: false,
  };
}

async function fetchHoroscopeCom(profile: HoroscopeProfile): Promise<HoroscopeDTO | null> {
  const html = await fetchWithTimeout(profile.webUrl, "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8");
  const { text, sourceDate } = extractHoroscopeComPayload(html);
  if (!text || !isCurrentSourceDate(sourceDate)) return null;
  const summary = await toChineseDisplaySummary(text, profile, sourceDate);
  if (!summary) return null;
  return {
    id: profile.id,
    name: profile.name,
    relation: profile.relation,
    signName: profile.signName,
    signKey: profile.signKey,
    stars: scoreFromText(text),
    summary,
    sourceName: "Horoscope.com",
    sourceUrl: profile.webUrl,
    sourceDate: sourceDate.toISOString(),
    updatedAt: new Date().toISOString(),
    isFallback: false,
  };
}

async function fetchAstrologyCom(profile: HoroscopeProfile): Promise<HoroscopeDTO | null> {
  const html = await fetchWithTimeout(profile.astrologyUrl, "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8");
  const { text, sourceDate } = extractAstrologyComPayload(html);
  if (!text || !isCurrentSourceDate(sourceDate)) return null;
  const summary = await toChineseDisplaySummary(text, profile, sourceDate);
  if (!summary) return null;
  return {
    id: profile.id,
    name: profile.name,
    relation: profile.relation,
    signName: profile.signName,
    signKey: profile.signKey,
    stars: scoreFromText(text),
    summary,
    sourceName: "Astrology.com",
    sourceUrl: profile.astrologyUrl,
    sourceDate: sourceDate.toISOString(),
    updatedAt: new Date().toISOString(),
    isFallback: false,
  };
}

async function fetchAstroSage(profile: HoroscopeProfile): Promise<HoroscopeDTO | null> {
  const feed = await fetchFeed(profile.feedUrl);
  const item = feed.items[0];
  if (!item) return null;
  const sourceDate = parseSourceDate(item.isoDate || item.pubDate);
  if (!isCurrentSourceDate(sourceDate)) return null;
  const rawText = item.content || item.contentSnippet || item.summary || item.title || "";
  const cleanText = sanitizeBriefingText(rawText, 720);
  const summary = await toChineseDisplaySummary(cleanText, profile, sourceDate);
  if (!summary) return null;
  return {
    id: profile.id,
    name: profile.name,
    relation: profile.relation,
    signName: profile.signName,
    signKey: profile.signKey,
    stars: scoreFromText(cleanText),
    summary,
    sourceName: "AstroSage RSS",
    sourceUrl: item.link || profile.feedUrl,
    sourceDate: sourceDate.toISOString(),
    updatedAt: new Date().toISOString(),
    isFallback: false,
  };
}

async function fetchHoroscope(profile: HoroscopeProfile): Promise<HoroscopeDTO | null> {
  try {
    const api = await fetchFreeHoroscopeApi(profile);
    if (api) return api;
  } catch {
    // Continue to live web sources.
  }

  try {
    const web = await fetchHoroscopeCom(profile);
    if (web) return web;
  } catch {
    // Continue to another live web source.
  }

  try {
    const astrology = await fetchAstrologyCom(profile);
    if (astrology) return astrology;
  } catch {
    // Continue to stale-guarded RSS.
  }

  try {
    const rss = await fetchAstroSage(profile);
    if (rss) return rss;
  } catch {
    // No local horoscope fallback. The UI should reflect that live sources are unavailable.
  }

  return null;
}

export async function getDailyHoroscopes(force = false): Promise<HoroscopeDTO[]> {
  const today = shanghaiDayKey();
  if (
    !force &&
    cachedHoroscopes &&
    cachedDay === today &&
    (cachedHoroscopes.length === PROFILES.length || Date.now() - cachedAt < PARTIAL_CACHE_TTL_MS)
  ) {
    return cachedHoroscopes;
  }
  const results = await Promise.all(PROFILES.map(fetchHoroscope));
  const liveResults = results.filter((item): item is HoroscopeDTO => item != null);
  if (liveResults.length > 0) {
    cachedHoroscopes = liveResults;
    cachedDay = today;
    cachedAt = Date.now();
  }
  return liveResults;
}

export function invalidateHoroscopeCache() {
  cachedHoroscopes = null;
  cachedDay = null;
  cachedAt = 0;
}
