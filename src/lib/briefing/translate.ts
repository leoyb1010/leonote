import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto-secret";

const AI_BASE = process.env.AI_BASE_URL || "https://api.deepseek.com";
const AI_ENV_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "deepseek-chat";
const TRANSLATE_TIMEOUT_MS = Number(process.env.BRIEFING_TRANSLATE_TIMEOUT_MS || 30_000);
const TRANSLATE_MAX_ITEMS = Number(process.env.BRIEFING_TRANSLATE_MAX_ITEMS || 12);

let cachedKey = "";

async function getAIKey(): Promise<string> {
  if (AI_ENV_KEY) { console.debug("[translate] using env AI key"); return AI_ENV_KEY; }
  if (cachedKey) { return cachedKey; }

  try {
    const setting = await prisma.aISetting.findFirst({
      where: { apiKey: { not: "" } },
      select: { apiKey: true },
    });
    if (setting?.apiKey) {
      cachedKey = decryptSecret(setting.apiKey) ?? "";
      console.log("[translate] using DB AI key, len=", cachedKey.length);
      return cachedKey;
    }
  } catch (e) {
    console.error("[translate] failed to get AI key from DB:", e instanceof Error ? e.message : "unknown");
  }
  console.error("[translate] NO AI KEY FOUND - translation disabled");
  return "";
}

/** Detect if text contains English/Traditional Chinese that needs normalization */
export function needsTranslation(text: string): boolean {
  if (!text) return false;
  
  // 检查是否包含英文单词（排除掉常见的 AI 缩写）
  const words = text.match(/[A-Za-z]{2,}/g) ?? [];
  const allowed = new Set(["AI", "AIGC", "OpenAI", "DeepSeek", "Claude", "Gemini", "GPT", "X"]);
  const hasEnglishWords = words.some(w => !allowed.has(w));

  const cjk = text.match(/[\u4e00-\u9fa5]/g); // Simplified Chinese range check
  const hasTraditional = /[\u4E00-\u9FFF]/.test(text) && !/^[\u4E00-\u9FA5\u3000-\u303F\uFF00-\uFFEF0-9a-zA-Z\s,.]+$/.test(text);
  
  // 如果全是英文单词，或者包含繁体，或者中文字符太少，就认为需要翻译
  return hasEnglishWords || !cjk || cjk.length < 3 || hasTraditional;
}

/** Translate 1 batch via DeepSeek, matches by position */
async function translateOneBatch(texts: string[], apiKey: string): Promise<string[]> {
  const normalizedTexts = texts.map((text) => text.replace(/\s+/g, " ").trim());
  const prompt = [
    "将以下资讯标题、摘要或正文摘录翻译/改写成自然、准确、适合个人日报阅读的简体中文。",
    "要求：保留必要专有名词；不要使用繁体；不要加入输入里没有的事实；输出必须是 JSON 字符串数组，顺序和输入一一对应，不要输出解释。",
    JSON.stringify(normalizedTexts),
  ].join("\n");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TRANSLATE_TIMEOUT_MS);

  let json: {
    error?: unknown;
    choices?: Array<{ message?: { content?: string } }>;
    usage?: unknown;
  };
  try {
    const res = await fetch(`${AI_BASE}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: "你是专业新闻编辑。将输入的外文或中英混杂资讯翻译/改写为自然、准确的简体中文（不要使用繁体）。输出的每行简体中文需与输入顺序一一对应，仅输出结果，不加编号。" },
          { role: "user", content: prompt },
        ],
        // 推理型模型（deepseek-v4-flash）会先消耗 reasoning_content token，
        // 需在"输出估算"之外预留充足推理余量，否则 content 被截断为空导致整批翻译回退原文
        max_tokens: Math.min(
          8000,
          Math.max(4000, Math.ceil(normalizedTexts.join("").length * 1.2) + texts.length * 80 + 4000),
        ),
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "unknown");
      console.error(`[translate] API ${res.status}:`, errText.slice(0, 300));
      return texts;
    }

    json = await res.json();
  } catch (error) {
    console.error("[translate] request failed:", error instanceof Error ? error.message : "unknown");
    return texts;
  } finally {
    clearTimeout(timer);
  }

  if (json.error) {
    console.error(`[translate] API error:`, JSON.stringify(json.error).slice(0, 300));
    return texts;
  }

  const raw = (json.choices?.[0]?.message?.content ?? "") as string;
  if (!raw) {
    console.error(`[translate] empty content from API, usage:`, JSON.stringify(json.usage ?? {}));
    return texts;
  }
  const parsed = parseJsonStringArray(raw);
  if (parsed.length === texts.length) return parsed.map(cleanTranslatedLine);

  const lines = raw.split("\n").map((l: string) => cleanTranslatedLine(l)).filter((l: string) => l.length > 0);

  if (lines.length !== texts.length) {
    console.error(`[translate] line mismatch: got ${lines.length}, expected ${texts.length}`);
    // Try to salvage: if more lines, truncate; if fewer, pad with originals
    const result = [...texts];
    for (let i = 0; i < Math.min(lines.length, texts.length); i++) {
      // Only accept if the result looks like a translation (different from input)
      if (lines[i] !== texts[i]) result[i] = lines[i];
    }
    return result;
  }

  return lines;
}

function parseJsonStringArray(input: string): string[] {
  const cleaned = input.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function cleanTranslatedLine(input: string): string {
  return input
    .trim()
    .replace(/^[-*•]\s*/, "")
    .replace(/^\d+[.)、]\s*/, "")
    .replace(/^["“”]+|["“”]+$/g, "")
    .trim();
}

/** Translate batch, splitting into chunks of 20 */
export async function translateBatch(texts: string[]): Promise<string[]> {
  if (texts.length === 0) return [];

  const apiKey = await getAIKey();
  if (!apiKey) { console.error("[translate] no API key"); return texts; }

  const chunkSize = 8; // 推理模型批次越小，单次推理开销越可控，避免超时与截断
  const result: string[] = [...texts];
  const maxItems = Number.isFinite(TRANSLATE_MAX_ITEMS)
    ? Math.max(0, TRANSLATE_MAX_ITEMS)
    : 60;
  const limitedTexts = texts.slice(0, maxItems);

  for (let offset = 0; offset < limitedTexts.length; offset += chunkSize) {
    const chunk = limitedTexts.slice(offset, offset + chunkSize);
    const translated = await translateOneBatch(chunk, apiKey);

    for (let i = 0; i < chunk.length; i++) {
      if (translated[i] && translated[i] !== chunk[i]) {
        result[offset + i] = translated[i];
      }
    }

    // Rate-limit: delay between chunks to avoid hitting API rate limits
    if (offset + chunkSize < limitedTexts.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return result;
}
