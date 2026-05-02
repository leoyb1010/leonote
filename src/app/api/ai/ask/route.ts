import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { requireAISettings, callChatText } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ message: "未登录" }, { status: 401 });
    }

    await requireAISettings(userId);
    const { question } = await request.json();

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json({ message: "请输入问题" }, { status: 400 });
    }

    const answer = await callChatText({
      userId,
      system: "你是 Leonote 的 AI 助手。用中文简洁回答用户问题。如果问题与笔记、知识管理无关，仍然友好回答。",
      prompt: question.trim(),
    });

    return NextResponse.json({ answer });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message?.includes("AI 未配置") || err.message?.includes("AI 配置不完整")) {
      return NextResponse.json({ message: "请先在设置中配置 AI" }, { status: 400 });
    }
    return NextResponse.json({ message: err.message || "AI 请求失败" }, { status: 500 });
  }
}
