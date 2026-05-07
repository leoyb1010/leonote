import { prisma } from "@/lib/prisma";
import { encryptSecret, decryptSecret } from "@/lib/crypto-secret";
import { checkRateLimit } from "@/lib/rate-limit";

const DEFAULT_BASE_URL =
  process.env.AI_BASE_URL ||
  process.env.OPENAI_BASE_URL ||
  "https://api.deepseek.com";
const DEFAULT_API_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
const DEFAULT_MODEL = process.env.AI_MODEL || "deepseek-v4-flash";
const FALLBACK_MODEL = process.env.AI_FALLBACK_MODEL || "deepseek-v4-pro";
const DEFAULT_ALLOWED_AI_HOSTS = [
  "api.deepseek.com",
  "api.openai.com",
  "api.anthropic.com",
  "api.moonshot.cn",
  "dashscope.aliyuncs.com",
  "open.bigmodel.cn",
];

export type AIResolvedSettings = {
  baseUrl: string;
  apiKey: string;
  model: string;
  fallbackModel: string;
  enableAutoOrganize: boolean;
};

export async function getAISettings(
  userId: string,
): Promise<AIResolvedSettings> {
  const saved = await prisma.aISetting.findUnique({ where: { userId } });
  return {
    baseUrl: saved?.baseUrl || DEFAULT_BASE_URL,
    apiKey: saved?.apiKey ? decryptSecret(saved.apiKey) : DEFAULT_API_KEY,
    model: saved?.model || DEFAULT_MODEL,
    fallbackModel: saved?.fallbackModel || FALLBACK_MODEL,
    enableAutoOrganize: saved?.enableAutoOrganize ?? true,
  };
}

export async function requireAISettings(userId: string) {
  const settings = await getAISettings(userId);
  if (!settings.baseUrl || !settings.apiKey || !settings.model) {
    throw new Error("AI 配置不完整，请先在设置页完成配置");
  }
  assertSafeAIBaseUrl(settings.baseUrl);
  return settings;
}

function allowedAIHosts() {
  const hosts = new Set(DEFAULT_ALLOWED_AI_HOSTS);
  for (const value of (process.env.AI_ALLOWED_HOSTS ?? "").split(",")) {
    const host = value.trim().toLowerCase();
    if (host) hosts.add(host);
  }

  for (const raw of [DEFAULT_BASE_URL, process.env.OPENAI_BASE_URL]) {
    if (!raw) continue;
    try {
      const url = new URL(raw);
      if (url.protocol === "https:") hosts.add(url.host.toLowerCase());
    } catch {
      // Startup env validation happens when the setting is used.
    }
  }

  return hosts;
}

export function assertSafeAIBaseUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("AI baseUrl 不合法");
  }

  if (url.protocol !== "https:") {
    throw new Error("AI baseUrl 必须使用 https");
  }

  if (!allowedAIHosts().has(url.host.toLowerCase())) {
    throw new Error("AI baseUrl 不在允许列表内");
  }

  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

export async function saveAISettings(
  userId: string,
  input: Partial<AIResolvedSettings>,
) {
  const current = await getAISettings(userId);
  const apiKey = input.apiKey ?? current.apiKey;
  const encryptedKey = apiKey ? encryptSecret(apiKey) : "";
  const baseUrl = assertSafeAIBaseUrl(input.baseUrl ?? current.baseUrl);

  return prisma.aISetting.upsert({
    where: { userId },
    create: {
      userId,
      baseUrl,
      apiKey: encryptedKey,
      model: input.model ?? current.model,
      fallbackModel: input.fallbackModel ?? current.fallbackModel,
      enableAutoOrganize:
        input.enableAutoOrganize ?? current.enableAutoOrganize,
    },
    update: {
      baseUrl,
      apiKey: encryptedKey,
      model: input.model ?? current.model,
      fallbackModel: input.fallbackModel ?? current.fallbackModel,
      enableAutoOrganize:
        input.enableAutoOrganize ?? current.enableAutoOrganize,
    },
  });
}

export function maskSecret(secret: string) {
  if (!secret) return "";
  if (secret.length <= 8) return "*".repeat(secret.length);
  return `${secret.slice(0, 4)}***${secret.slice(-4)}`;
}

async function assertAIRateLimit(
  route: string,
  userId: string,
  limit: number,
) {
  const check = checkRateLimit(`ai:${route}:${userId}`, limit, 60_000);
  if (!check.ok) {
    throw new Error("AI 请求过于频繁，请稍后再试");
  }
}

export async function callChatJSON<T>({
  userId,
  system,
  prompt,
  model,
  temperature = 0.2,
}: {
  userId: string;
  system: string;
  prompt: string;
  model?: string;
  temperature?: number;
}): Promise<T> {
  await assertAIRateLimit("json", userId, 20);
  const settings = await requireAISettings(userId);
  const baseUrl = assertSafeAIBaseUrl(settings.baseUrl);
  const res = await fetch(
    `${baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: model || settings.model,
        temperature,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`AI 请求失败：${res.status}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("AI 未返回内容");
  return JSON.parse(content) as T;
}

export async function callChatText({
  userId,
  system,
  prompt,
  model,
  temperature = 0.2,
}: {
  userId: string;
  system: string;
  prompt: string;
  model?: string;
  temperature?: number;
}) {
  await assertAIRateLimit("text", userId, 20);
  const settings = await requireAISettings(userId);
  const baseUrl = assertSafeAIBaseUrl(settings.baseUrl);
  const res = await fetch(
    `${baseUrl}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: model || settings.model,
        temperature,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`AI 请求失败：${res.status}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("AI 未返回内容");
  return content;
}
