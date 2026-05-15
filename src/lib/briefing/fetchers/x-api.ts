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
  return /AI|OpenAI|ChatGPT|GPT|Claude|Gemini|DeepMind|Agent|model|NVIDIA|GPU|chip|data center|developer|security|release|launch|人工智能|大模型|模型|智能体|芯片|算力|发布|推出|开源|安全|开发者/i.test(text);
}

export async function fetchXSignals() {
  if (!bearerToken()) {
    return { ok: false, skipped: true, reason: "X_BEARER_TOKEN not configured", users: 0, inserted: 0 };
  }

  const users = configuredUsers();
  let inserted = 0;
  let failed = 0;
  let lastError = "";

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

  return { ok: true, skipped: false, users: users.length, inserted, failed, lastError: lastError || undefined };
}
