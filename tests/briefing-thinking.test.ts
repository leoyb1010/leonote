import { afterEach, describe, expect, it, vi } from "vitest";
import { getBriefingThinkingInsights } from "@/lib/briefing/thinking";
import type { NewsItemDTO } from "@/lib/briefing/types";

function newsItem(overrides: Partial<NewsItemDTO>): NewsItemDTO {
  return {
    id: overrides.id ?? "item",
    title: overrides.title ?? "测试资讯",
    url: "https://example.com",
    imageUrl: null,
    excerpt: "",
    detailText: overrides.detailText ?? overrides.aiSummary ?? "",
    category: overrides.category ?? "ai_tech",
    sourceName: overrides.sourceName ?? "测试源",
    publishedAt: overrides.publishedAt ?? new Date().toISOString(),
    aiSummary: overrides.aiSummary ?? null,
    aiKeyPoints: overrides.aiKeyPoints ?? [],
    aiTags: overrides.aiTags ?? [],
    aiScore: overrides.aiScore ?? 0.84,
    readingMinutes: 2,
    isRead: false,
    isFavorited: false,
    isImported: false,
    importedNoteId: null,
  };
}

describe("briefing thinking insights", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not label ordinary AI or product news as a US-China agenda", async () => {
    vi.stubEnv("DATABASE_URL", "");

    const insights = await getBriefingThinkingInsights("test-user", [
      newsItem({
        id: "qwen-taobao",
        title: "氪星晚报｜千问与淘宝打通，正式上线 AI 购物",
        aiSummary: "阿里把 AI 助手接入购物链路，重点是消费入口和转化效率。",
        aiTags: ["人工智能", "电商"],
      }),
      newsItem({
        id: "ai-funding",
        title: "500 亿融资加码却集体喊穷，AI 的钱究竟烧在哪了",
        aiSummary: "AI 公司融资继续升温，但算力和获客成本仍在抬升。",
        aiTags: ["AI", "融资"],
      }),
      newsItem({
        id: "honor-phone",
        title: "荣耀 600 系列手机国行版官宣，肖战代言",
        aiSummary: "新手机发布节奏推进，属于消费电子产品更新。",
        aiTags: ["手机", "消费电子"],
      }),
      newsItem({
        id: "nio-car",
        title: "消息称 2026 款乐道 L60 汽车将开启预售",
        aiSummary: "新能源汽车产品节奏更新，重点在定价和交付。",
        aiTags: ["汽车", "市场"],
      }),
      newsItem({
        id: "samsung-fridge",
        title: "三星 AI 冰箱在美迎来重大升级：接入谷歌 Gemini 模型",
        aiSummary: "家电接入 AI 模型，反映智能家居入口竞争。",
        aiTags: ["AI硬件", "智能家居"],
      }),
    ], 5);

    expect(insights.every((insight) => insight.title.startsWith("中美议程里的科技变量"))).toBe(false);
    expect(insights.filter((insight) => insight.title.startsWith("中美议程里的科技变量"))).toHaveLength(0);
  });

  it("keeps the Trump China chip case as a specific strategic signal", async () => {
    vi.stubEnv("DATABASE_URL", "");

    const insights = await getBriefingThinkingInsights("test-user", [
      newsItem({
        id: "trump-chip",
        title: "特朗普访华将带上黄仁勋讨论 AI 芯片出口",
        sourceName: "BBC",
        aiSummary: "特朗普访华与黄仁勋同行让 AI 芯片出口许可重新成为中美科技议程的核心变量。",
        detailText: "美国总统特朗普计划访问中国，英伟达 CEO 黄仁勋同行。市场关注 H200、Blackwell、GPU 出口许可和对华芯片制裁是否出现转向。",
        aiKeyPoints: ["黄仁勋随行", "GPU 出口许可"],
        aiTags: ["AI芯片", "中美科技"],
        aiScore: 0.9,
      }),
    ], 3);

    expect(insights[0]?.title).toContain("特朗普访华与AI芯片");
    expect(insights[0]?.impactLabel).toBe("战略信号");
  });
});
