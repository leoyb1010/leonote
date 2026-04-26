import { NextResponse } from "next/server";
import { callChatText } from "@/lib/ai";
import { getSessionUserId } from "@/lib/session";

const fallbackLines = [
  "把重要的事推进一寸。",
  "少做噪音，多留证据。",
  "今天只解决真正卡住的点。",
  "先完成，再打磨。",
  "让记录替你减轻记忆负担。",
  "把模糊的问题写清楚。",
  "稳住节奏，交付结果。",
];

function getShanghaiDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function fallbackForDate(dateKey: string) {
  const seed = Array.from(dateKey).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return fallbackLines[seed % fallbackLines.length];
}

function cleanLine(input: string) {
  return input
    .replace(/^["“”'「」]+|["“”'「」]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 36);
}

export async function GET() {
  const userId = await getSessionUserId();
  const dateKey = getShanghaiDateKey();
  const fallback = fallbackForDate(dateKey);

  if (!userId) {
    return NextResponse.json({ ok: true, date: dateKey, source: "fallback", line: fallback });
  }

  try {
    const text = await callChatText({
      userId,
      temperature: 0.7,
      system: "你是一个克制、直接、有审美的工作伙伴。只输出一句中文，不要解释，不要引号，不要口号腔。",
      prompt: `今天是 ${dateKey}。请生成一句适合个人工作台首页的当日工作激励话。要求：简短有力、成熟、不土气、不鸡血、不超过 18 个中文字符。`,
    });
    const line = cleanLine(text);
    return NextResponse.json({ ok: true, date: dateKey, source: "ai", line: line || fallback });
  } catch {
    return NextResponse.json({ ok: true, date: dateKey, source: "fallback", line: fallback });
  }
}
