import { describe, expect, it } from "vitest";
import { buildBriefingEventRadar, buildBriefingXSignals } from "@/lib/briefing/event-radar";
import type { NewsItemDTO } from "@/lib/briefing/types";

function newsItem(overrides: Partial<NewsItemDTO>): NewsItemDTO {
  return {
    id: overrides.id ?? "item",
    title: overrides.title ?? "测试资讯",
    url: overrides.url ?? "https://example.com",
    imageUrl: null,
    excerpt: overrides.excerpt ?? "",
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

describe("briefing event radar", () => {
  it("prioritizes real AI and tech events without forcing the user example into every title", () => {
    const events = buildBriefingEventRadar([
      newsItem({
        id: "deepmind",
        title: "Google DeepMind 发布 Gemini 推理能力升级",
        sourceName: "Google DeepMind",
        aiSummary: "Gemini 在多模态和推理任务上继续提升，可能影响企业模型选型。",
        aiTags: ["人工智能", "模型平台"],
        aiScore: 0.9,
      }),
      newsItem({
        id: "nvidia",
        title: "英伟达 Blackwell 服务器订单继续增加",
        sourceName: "CNBC",
        aiSummary: "AI 数据中心扩张继续抬升 GPU、HBM 和云基础设施需求。",
        aiTags: ["算力", "芯片"],
        aiScore: 0.88,
      }),
      newsItem({
        id: "security",
        title: "谷歌警告攻击者正用 AI 寻找漏洞",
        sourceName: "BleepingComputer",
        aiSummary: "AI 安全事件开始影响企业采购和平台开放策略。",
        aiTags: ["AI安全", "企业IT"],
        aiScore: 0.86,
      }),
    ]);

    expect(events.length).toBeGreaterThanOrEqual(3);
    expect(events[0]?.scope).toBe("ai_tech");
    expect(events.every((event) => !event.title.includes("中美议程"))).toBe(true);
    expect(events.some((event) => event.scopeLabel === "AI 科技")).toBe(true);
  });

  it("extracts official X signal cards from monitored account posts", () => {
    const signals = buildBriefingXSignals([
      newsItem({
        id: "x-openai",
        title: "We launched a new agent capability for developers",
        url: "https://x.com/OpenAI/status/123",
        sourceName: "X · OpenAI",
        aiSummary: "来自 X · OpenAI：OpenAI 发布新的开发者智能体能力。",
        aiTags: ["X监控", "OpenAI", "人工智能"],
        aiScore: 0.92,
      }),
    ]);

    expect(signals).toHaveLength(1);
    expect(signals[0]?.username).toBe("OpenAI");
    expect(signals[0]?.impactLabel).toBe("强信号");
    expect(signals[0]?.summary).toContain("OpenAI");
  });
});
