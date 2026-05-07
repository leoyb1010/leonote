import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { getAISettings, maskSecret, saveAISettings } from "@/lib/ai";
import { guardUserWriteRequest } from "@/lib/request-guard";

const schema = z.object({
  baseUrl: z.string().url().optional(),
  apiKey: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  fallbackModel: z.string().min(1).optional(),
  enableAutoOrganize: z.boolean().optional(),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const settings = await getAISettings(userId);
  return NextResponse.json({
    ok: true,
    settings: {
      baseUrl: settings.baseUrl,
      apiKeyMasked: maskSecret(settings.apiKey),
      hasApiKey: Boolean(settings.apiKey),
      model: settings.model,
      fallbackModel: settings.fallbackModel,
      enableAutoOrganize: settings.enableAutoOrganize,
    },
  });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ message: "未登录" }, { status: 401 });
  const guarded = guardUserWriteRequest(request, userId, "ai-settings", { limit: 20 });
  if (guarded) return guarded;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ message: "参数不合法" }, { status: 400 });

  let saved;
  try {
    saved = await saveAISettings(userId, parsed.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 配置暂时没保存";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }

  const settings = await getAISettings(userId);
  return NextResponse.json({
    ok: true,
    settings: {
      baseUrl: saved.baseUrl,
      apiKeyMasked: maskSecret(settings.apiKey),
      hasApiKey: Boolean(settings.apiKey),
      model: saved.model,
      fallbackModel: saved.fallbackModel,
      enableAutoOrganize: saved.enableAutoOrganize,
    },
  });
}
