import Parser from "rss-parser";
import { sanitizeBriefingText, stableExternalId } from "./normalize";
import type { HoroscopeDTO } from "./types";

type HoroscopeProfile = {
  id: HoroscopeDTO["id"];
  name: string;
  relation: string;
  signName: string;
  signKey: HoroscopeDTO["signKey"];
  feedUrl: string;
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

const CACHE_TTL = 6 * 60 * 60 * 1000;
const FEED_TIMEOUT_MS = 12_000;
let cachedHoroscopes: HoroscopeDTO[] | null = null;
let cacheTime = 0;

const PROFILES: HoroscopeProfile[] = [
  {
    id: "leo",
    name: "Leo",
    relation: "我",
    signName: "天秤座",
    signKey: "libra",
    feedUrl: "https://feeds.feedburner.com/AstroSageLibra",
  },
  {
    id: "ellen",
    name: "Ellen",
    relation: "老婆",
    signName: "双鱼座",
    signKey: "pisces",
    feedUrl: "https://feeds.feedburner.com/AstroSagePisces",
  },
  {
    id: "bubu",
    name: "BuBu",
    relation: "女儿",
    signName: "双子座",
    signKey: "gemini",
    feedUrl: "https://feeds.feedburner.com/AstroSageGemini",
  },
];

const parser = new Parser<Record<string, unknown>, HoroscopeRssItem>({
  headers: {
    Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    "User-Agent": "Mozilla/5.0 (compatible; LeonoteBriefing/1.0; +https://leonote.local)",
  },
});

const POSITIVE_RE = /\b(good|great|success|successful|gain|benefit|happy|happiness|favorable|positive|support|opportunity|progress|profit|romance|love|energy|confidence|luck|reward|improve|growth|achievement)\b/gi;
const CAUTION_RE = /\b(avoid|caution|careful|stress|problem|loss|conflict|delay|trouble|issue|worry|tension|argument|expense|health|pressure|risk|obstacle|dispute)\b/gi;

const FALLBACK_SUMMARY: Record<HoroscopeDTO["signKey"], string> = {
  libra: "今天适合保持平衡感，先把信息看全，再做取舍。遇到分歧时，少急着定论，多留一点转圜空间。",
  pisces: "今天更适合顺着感受走，但重要沟通要落到具体行动上。把情绪照顾好，事情会更容易推进。",
  gemini: "今天好奇心会带来新想法，适合学习、表达和探索。注意不要同时打开太多任务，保留一点专注。",
};

function dateSeed(profile: HoroscopeProfile) {
  const today = new Date().toISOString().slice(0, 10);
  return stableExternalId(`${today}-${profile.id}-${profile.signKey}`);
}

function fallbackStars(profile: HoroscopeProfile) {
  return 3 + (Number.parseInt(dateSeed(profile).slice(0, 2), 16) % 3);
}

function clampStars(value: number) {
  return Math.max(1, Math.min(5, Math.round(value)));
}

function scoreFromText(text: string, profile: HoroscopeProfile) {
  const positive = text.match(POSITIVE_RE)?.length ?? 0;
  const caution = text.match(CAUTION_RE)?.length ?? 0;
  if (positive === 0 && caution === 0) return fallbackStars(profile);
  return clampStars(3 + Math.min(2, positive) * 0.75 - Math.min(2, caution) * 0.65);
}

async function fetchFeed(feedUrl: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
  try {
    const res = await fetch(feedUrl, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; LeonoteBriefing/1.0; +https://leonote.local)",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Horoscope RSS failed: ${res.status}`);
    return parser.parseString(await res.text());
  } finally {
    clearTimeout(timer);
  }
}

function fallbackHoroscope(profile: HoroscopeProfile): HoroscopeDTO {
  return {
    id: profile.id,
    name: profile.name,
    relation: profile.relation,
    signName: profile.signName,
    signKey: profile.signKey,
    stars: fallbackStars(profile),
    summary: FALLBACK_SUMMARY[profile.signKey],
    sourceName: "本地兜底",
    sourceUrl: profile.feedUrl,
    updatedAt: new Date().toISOString(),
    isFallback: true,
  };
}

async function fetchHoroscope(profile: HoroscopeProfile): Promise<HoroscopeDTO> {
  try {
    const feed = await fetchFeed(profile.feedUrl);
    const item = feed.items[0];
    if (!item) return fallbackHoroscope(profile);
    const rawText = item.content || item.contentSnippet || item.summary || item.title || "";
    const summary = sanitizeBriefingText(rawText, 180) || FALLBACK_SUMMARY[profile.signKey];
    const updatedAt = item.isoDate || item.pubDate;
    const parsedDate = updatedAt ? new Date(updatedAt) : new Date();

    return {
      id: profile.id,
      name: profile.name,
      relation: profile.relation,
      signName: profile.signName,
      signKey: profile.signKey,
      stars: scoreFromText(summary, profile),
      summary,
      sourceName: "AstroSage RSS",
      sourceUrl: item.link || profile.feedUrl,
      updatedAt: Number.isFinite(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString(),
      isFallback: false,
    };
  } catch {
    return fallbackHoroscope(profile);
  }
}

export async function getDailyHoroscopes(): Promise<HoroscopeDTO[]> {
  if (cachedHoroscopes && Date.now() - cacheTime < CACHE_TTL) return cachedHoroscopes;
  cachedHoroscopes = await Promise.all(PROFILES.map(fetchHoroscope));
  cacheTime = Date.now();
  return cachedHoroscopes;
}
