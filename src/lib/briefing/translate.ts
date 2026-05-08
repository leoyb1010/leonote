import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto-secret";

const AI_BASE = process.env.AI_BASE_URL || "https://api.deepseek.com";
const AI_ENV_KEY = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "deepseek-chat";

let cachedKey = "";

async function getAIKey(): Promise<string> {
  if (AI_ENV_KEY) { console.log("[translate] using env AI key"); return AI_ENV_KEY; }
  if (cachedKey) { return cachedKey; }

  try {
    const setting = await prisma.aISetting.findFirst({
      where: { apiKey: { not: "" } },
      select: { apiKey: true },
    });
    if (setting?.apiKey) {
      cachedKey = decryptSecret(setting.apiKey);
      console.log("[translate] using DB AI key, len=", cachedKey.length);
      return cachedKey;
    }
  } catch (e) {
    console.error("[translate] failed to get AI key from DB:", e instanceof Error ? e.message : "unknown");
  }
  console.error("[translate] NO AI KEY FOUND - translation disabled");
  return "";
}

/** Detect if text contains Chinese characters */
export function needsTranslation(text: string): boolean {
  const cjk = text.match(/[一-鿿]/g);
  return !cjk || cjk.length < 5;
}

/** Translate 1 batch via DeepSeek, matches by position */
async function translateOneBatch(texts: string[], apiKey: string): Promise<string[]> {
  const prompt = [
    "将以下资讯标题或摘要改写成自然、准确、适合中文简报阅读的中文。保留必要专有名词，输出每行的中文结果（顺序与输入一一对应，不要编号）：",
    ...texts,
  ].join("\n");

  const res = await fetch(`${AI_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: "你是专业中文新闻编辑。输入N行外文或中英混杂资讯，输出N行简洁中文，顺序对应。只输出中文结果，不加编号或解释。" },
        { role: "user", content: prompt },
      ],
      max_tokens: Math.max(2048, texts.length * 120),
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "unknown");
    console.error(`[translate] API ${res.status}:`, errText.slice(0, 300));
    return texts;
  }

  const json = await res.json();

  if (json.error) {
    console.error(`[translate] API error:`, JSON.stringify(json.error).slice(0, 300));
    return texts;
  }

  const raw = (json.choices?.[0]?.message?.content ?? "") as string;
  if (!raw) {
    console.error(`[translate] empty content from API, usage:`, JSON.stringify(json.usage ?? {}));
    return texts;
  }
  const lines = raw.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);

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

/** Translate batch, splitting into chunks of 20 */
export async function translateBatch(texts: string[]): Promise<string[]> {
  if (texts.length === 0) return [];

  const apiKey = await getAIKey();
  if (!apiKey) { console.error("[translate] no API key"); return texts; }

  const chunkSize = 20;
  const result: string[] = [...texts];

  for (let offset = 0; offset < texts.length; offset += chunkSize) {
    const chunk = texts.slice(offset, offset + chunkSize);
    const translated = await translateOneBatch(chunk, apiKey);

    for (let i = 0; i < chunk.length; i++) {
      if (translated[i] && translated[i] !== chunk[i]) {
        result[offset + i] = translated[i];
      }
    }
  }

  return result;
}
