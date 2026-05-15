import Parser from "rss-parser";
import { prisma } from "@/lib/prisma";
import { sourceDisplayName } from "../display";
import { stableExternalId, sanitizeBriefingText } from "../normalize";

type XUserConfig = {
  username: string;
  label: string;
  weight: number;
};

type XUser = {
  id: string;
  name?: string;
  username?: string;
};

type XPost = {
  id: string;
  text?: string;
  created_at?: string;
};

type XFeedItem = {
  title?: string;
  link?: string;
  guid?: string;
  content?: string;
  contentSnippet?: string;
  summary?: string;
  isoDate?: string;
  pubDate?: string;
};

const mirrorParser = new Parser<Record<string, unknown>, XFeedItem>({
  timeout: 12_000,
  headers: {
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
    "User-Agent": "Mozilla/5.0 (compatible; LeonoteBriefing/1.0; +https://leonote.local)",
  },
});

const DEFAULT_X_USERS: XUserConfig[] = [
  { username: "OpenAI", label: "OpenAI", weight: 92 },
  { username: "AnthropicAI", label: "Anthropic", weight: 90 },
  { username: "GoogleDeepMind", label: "Google DeepMind", weight: 90 },
  { username: "sama", label: "Sam Altman", weight: 88 },
  { username: "elonmusk", label: "Elon Musk", weight: 84 },
  { username: "karpathy", label: "Andrej Karpathy", weight: 82 },
  { username: "nvidia", label: "NVIDIA", weight: 86 },
  { username: "github", label: "GitHub", weight: 78 },
];

function bearerToken() {
  return process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN || "";
}

function configuredMirrorBases() {
  const raw = process.env.BRIEFING_X_MIRROR_BASES?.trim();
  const defaults = [
    "https://nitter.net",
    "https://xcancel.com",
    "https://rss.xcancel.com",
    "https://rsshub.rssforever.com",
    "https://rsshub.feeded.xyz",
    "https://hub.slarker.me",
    "https://rsshub.liumingye.cn",
  ];
  return (raw ? raw.split(",") : defaults)
    .map((base) => base.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function configuredUsers(): XUserConfig[] {
  const raw = process.env.BRIEFING_X_USERS?.trim();
  if (!raw) return DEFAULT_X_USERS;

  return raw
    .split(",")
    .map((item): XUserConfig | null => {
      const [usernameRaw, labelRaw, weightRaw] = item.split(":").map((part) => part.trim());
      const username = usernameRaw?.replace(/^@/, "");
      if (!username) return null;
      const label = labelRaw || username;
      const weight = Number(weightRaw);
      return {
        username,
        label,
        weight: Number.isFinite(weight) ? Math.max(40, Math.min(100, weight)) : 82,
      };
    })
    .filter((item): item is XUserConfig => Boolean(item));
}

async function xFetch<T>(path: string): Promise<T> {
  const token = bearerToken();
  if (!token) throw new Error("X_BEARER_TOKEN not configured");

  const res = await fetch(`https://api.x.com/2${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "LeonoteBriefing/1.0",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`X API ${res.status}: ${text.slice(0, 160)}`);
  }

  return res.json() as Promise<T>;
}

function stripPostText(text: string) {
  return sanitizeBriefingText(
    text
      .replace(/https?:\/\/\S+/g, "")
      .replace(/\s+/g, " ")
      .trim(),
    700,
  );
}

function shouldKeepPost(text: string) {
  if (!text || text.length < 18) return false;
  if (/^(RT|转推)\b/i.test(text)) return false;
  if (/RSS reader not yet whitelisted|Verifying your request|Just a moment|Welcome to RSSHub|Making sure you/i.test(text)) return false;
  return /AI|OpenAI|ChatGPT|GPT|Claude|Gemini|DeepMind|Agent|model|NVIDIA|GPU|chip|data center|developer|security|release|launch|Grok|xAI|Tesla|SpaceX|robot|humanoid|tariff|China|人工智能|大模型|模型|智能体|芯片|算力|发布|推出|开源|安全|开发者|机器人|特斯拉|航天|关税|中国/i.test(text);
}

function mirrorFeedUrl(base: string, username: string) {
  const safeUser = encodeURIComponent(username.replace(/^@/, ""));
  if (/xcancel\.com|nitter\./i.test(base)) return `${base}/${safeUser}/rss`;
  return `${base}/x/user/${safeUser}`;
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; LeonoteBriefing/1.0; +https://leonote.local)",
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function safeDate(isoDate?: string, pubDate?: string) {
  const raw = isoDate || pubDate || "";
  const date = raw ? new Date(raw) : new Date();
  return Number.isFinite(date.getTime()) ? date : new Date();
}

function statusIdFromUrl(url: string) {
  const match = url.match(/status\/(\d+)/i);
  return match?.[1] ?? "";
}

function isInvalidMirrorPayload(xml: string, feedTitle?: string) {
  const text = `${feedTitle ?? ""} ${xml.slice(0, 1800)}`;
  return /RSS reader not yet whitelisted|Verifying your request|Just a moment|Welcome to RSSHub|Making sure you/i.test(text);
}

async function upsertMirrorPost(config: XUserConfig, sourceId: string, sourceName: string, item: XFeedItem) {
  const rawText = stripPostText(`${item.title ?? ""} ${item.contentSnippet ?? item.summary ?? item.content ?? ""}`);
  if (!shouldKeepPost(rawText)) return false;
  const url = item.link?.trim() || `https://x.com/${config.username}`;
  const externalId = statusIdFromUrl(url) || item.guid || stableExternalId(`${config.username}:${url}:${rawText}`);
  const title = sanitizeBriefingText(rawText, 92);
  const summary = sanitizeBriefingText(`来自 ${sourceDisplayName(sourceName, "social_x")}：${rawText}`, 220);

  await prisma.newsItem.upsert({
    where: {
      sourceId_externalId: {
        sourceId,
        externalId,
      },
    },
    create: {
      sourceId,
      externalId,
      title,
      url,
      excerpt: summary,
      content: rawText,
      publishedAt: safeDate(item.isoDate, item.pubDate),
      fetchedAt: new Date(),
      category: "ai_tech",
      language: /[\u3400-\u9fff]/.test(rawText) ? "zh" : "en",
      region: "global",
      aiSummary: summary,
      aiKeyPoints: JSON.stringify([title]),
      aiTags: JSON.stringify(["X监控", config.label, "镜像源"]),
      aiScore: Math.max(0.62, Math.min(0.94, config.weight / 100)),
    },
    update: {
      title,
      url,
      excerpt: summary,
      content: rawText,
      publishedAt: safeDate(item.isoDate, item.pubDate),
      fetchedAt: new Date(),
      category: "ai_tech",
      aiSummary: summary,
      aiKeyPoints: JSON.stringify([title]),
      aiTags: JSON.stringify(["X监控", config.label, "镜像源"]),
      aiScore: Math.max(0.62, Math.min(0.94, config.weight / 100)),
    },
  });
  return true;
}

async function fetchMirrorSignalsForUser(config: XUserConfig) {
  const sourceId = stableExternalId(`x:${config.username}`);
  const sourceName = `X · ${config.label}`;
  let lastError = "";

  for (const base of configuredMirrorBases()) {
    const feedUrl = mirrorFeedUrl(base, config.username);
    try {
      const xml = await fetchText(feedUrl);
      const feed = await mirrorParser.parseString(xml);
      if (isInvalidMirrorPayload(xml, feed.title) || feed.items.length === 0) {
        throw new Error("镜像返回占位页或空内容");
      }
      await prisma.newsSource.upsert({
        where: { id: sourceId },
        create: {
          id: sourceId,
          kind: "rss",
          url: feedUrl,
          name: sourceName,
          category: "ai_tech",
          region: "global",
          weight: config.weight,
          enabled: true,
          lastFetchAt: new Date(),
        },
        update: {
          kind: "rss",
          url: feedUrl,
          name: sourceName,
          category: "ai_tech",
          region: "global",
          weight: config.weight,
          enabled: true,
          lastFetchAt: new Date(),
          failCount: 0,
        },
      });

      let inserted = 0;
      for (const item of feed.items.slice(0, 12)) {
        if (await upsertMirrorPost(config, sourceId, sourceName, item)) inserted += 1;
      }
      if (inserted > 0) return { inserted, base: feedUrl, failed: 0, lastError: "" };
      lastError = `镜像没有可用动态：${feedUrl}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "unknown";
    }
  }

  return { inserted: 0, base: "", failed: 1, lastError };
}

async function fetchMirrorXSignals(users: XUserConfig[]) {
  let inserted = 0;
  let failed = 0;
  let lastError = "";

  for (const user of users) {
    const result = await fetchMirrorSignalsForUser(user);
    inserted += result.inserted;
    failed += result.failed;
    if (result.lastError) lastError = result.lastError;
  }

  return { inserted, failed, lastError };
}

export async function fetchXSignals() {
  const users = configuredUsers();
  let inserted = 0;
  let failed = 0;
  let lastError = "";
  const mirror = await fetchMirrorXSignals(users);
  inserted += mirror.inserted;
  failed += mirror.failed;
  if (mirror.lastError) lastError = mirror.lastError;

  const useOfficialApi = process.env.BRIEFING_X_USE_OFFICIAL_API === "true";
  if (!useOfficialApi || inserted > 0) {
    return { ok: true, skipped: inserted === 0, users: users.length, inserted, failed, lastError: lastError || undefined };
  }

  if (bearerToken()) {
    for (const config of users) {
      try {
        const userResponse = await xFetch<{ data?: XUser }>(`/users/by/username/${encodeURIComponent(config.username)}?user.fields=name,username`);
        const user = userResponse.data;
        if (!user?.id) continue;

        const sourceId = stableExternalId(`x:${config.username}`);
        const sourceName = `X · ${config.label}`;
        await prisma.newsSource.upsert({
          where: { id: sourceId },
          create: {
            id: sourceId,
            kind: "api",
            url: `https://x.com/${config.username}`,
            name: sourceName,
            category: "ai_tech",
            region: "global",
            weight: config.weight,
            enabled: true,
            lastFetchAt: new Date(),
          },
          update: {
            kind: "api",
            url: `https://x.com/${config.username}`,
            name: sourceName,
            category: "ai_tech",
            region: "global",
            weight: config.weight,
            enabled: true,
            lastFetchAt: new Date(),
            failCount: 0,
          },
        });

        const timeline = await xFetch<{ data?: XPost[] }>(
          `/users/${user.id}/tweets?max_results=10&exclude=retweets,replies&tweet.fields=created_at,lang`,
        );

        for (const post of timeline.data ?? []) {
          const text = stripPostText(post.text ?? "");
          if (!shouldKeepPost(text)) continue;
          const title = sanitizeBriefingText(text, 92);
          const publishedAt = post.created_at ? new Date(post.created_at) : new Date();
          const safePublishedAt = Number.isFinite(publishedAt.getTime()) ? publishedAt : new Date();
          const url = `https://x.com/${config.username}/status/${post.id}`;
          const summary = sanitizeBriefingText(`来自 ${sourceDisplayName(sourceName, "social_x")}：${text}`, 220);

          await prisma.newsItem.upsert({
            where: {
              sourceId_externalId: {
                sourceId,
                externalId: post.id,
              },
            },
            create: {
              sourceId,
              externalId: post.id,
              title,
              url,
              excerpt: summary,
              content: text,
              publishedAt: safePublishedAt,
              fetchedAt: new Date(),
              category: "ai_tech",
              language: /[\u3400-\u9fff]/.test(text) ? "zh" : "en",
              region: "global",
              aiSummary: summary,
              aiKeyPoints: JSON.stringify([title]),
              aiTags: JSON.stringify(["X监控", config.label, "人工智能"]),
              aiScore: Math.max(0.62, Math.min(0.96, config.weight / 100)),
            },
            update: {
              title,
              url,
              excerpt: summary,
              content: text,
              publishedAt: safePublishedAt,
              fetchedAt: new Date(),
              category: "ai_tech",
              aiSummary: summary,
              aiKeyPoints: JSON.stringify([title]),
              aiTags: JSON.stringify(["X监控", config.label, "人工智能"]),
              aiScore: Math.max(0.62, Math.min(0.96, config.weight / 100)),
            },
          });
          inserted += 1;
        }
      } catch (error) {
        failed += 1;
        lastError = error instanceof Error ? error.message : "unknown";
        console.warn(`[briefing:x] ${config.username} failed`, lastError);
      }
    }
  } else {
    lastError = "官方接口未配置，镜像源暂未返回可用动态";
  }

  return { ok: true, skipped: inserted === 0, users: users.length, inserted, failed, lastError: lastError || undefined };
}
