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

  it("does not collapse ordinary AI or product news into geopolitics", async () => {
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

    expect(insights.some((insight) => insight.whyItMatters.includes("地缘与制度"))).toBe(false);
    expect(insights.some((insight) => insight.whyItMatters.includes("AI 产品入口"))).toBe(true);
    expect(insights.some((insight) => insight.whyItMatters.includes("AI 资本与成本"))).toBe(true);
  });

  it("returns at least six high-impact AI technology thoughts when enough items exist", async () => {
    vi.stubEnv("DATABASE_URL", "");

    const insights = await getBriefingThinkingInsights("test-user", [
      newsItem({
        id: "openai-agent",
        title: "OpenAI 发布新的智能体平台，开放浏览器自动化能力",
        sourceName: "OpenAI Blog",
        aiSummary: "OpenAI 把智能体能力推向更完整的任务执行入口。",
        aiTags: ["AI", "智能体", "平台"],
      }),
      newsItem({
        id: "gemini-reasoning",
        title: "Google DeepMind 升级 Gemini 推理模型，多模态任务表现提升",
        sourceName: "Google DeepMind",
        aiSummary: "Gemini 的推理和多模态能力增强，可能影响开发者和企业应用选型。",
        aiTags: ["Gemini", "模型"],
      }),
      newsItem({
        id: "nvidia-blackwell",
        title: "英伟达 Blackwell 服务器订单继续增加，AI 数据中心扩张提速",
        sourceName: "CNBC",
        aiSummary: "AI 算力需求继续外溢到芯片、服务器和云基础设施。",
        aiTags: ["算力", "芯片"],
      }),
      newsItem({
        id: "ai-funding-round",
        title: "头部 AI 应用完成新一轮融资，估值与算力成本同时上升",
        sourceName: "TechCrunch",
        aiSummary: "AI 应用商业化压力继续增加，资本开始重新评估增长质量。",
        aiTags: ["AI融资", "成本"],
      }),
      newsItem({
        id: "ai-security-rule",
        title: "企业 AI 数据泄露事件推动新的安全合规要求",
        sourceName: "BleepingComputer",
        aiSummary: "企业部署 AI 时的数据边界和合规风险开始成为采购前提。",
        aiTags: ["AI安全", "合规"],
      }),
      newsItem({
        id: "github-ai-code",
        title: "GitHub 推出新的 AI 代码审查 API，开发者工作流继续变化",
        sourceName: "GitHub Blog",
        aiSummary: "AI 代码工具从补全进入审查和协作流程。",
        aiTags: ["开发者", "AI工程"],
      }),
      newsItem({
        id: "ai-search-shopping",
        title: "淘宝接入千问 AI 助手，购物搜索入口开始重构",
        sourceName: "36氪",
        aiSummary: "电商入口接入 AI 助手，可能改变用户搜索和决策路径。",
        aiTags: ["AI产品", "电商"],
      }),
    ]);

    expect(insights).toHaveLength(6);
    expect(insights.every((insight) => /^OpenAI|^Google|^英伟达|^头部|^企业|^GitHub|^淘宝/.test(insight.title))).toBe(true);
    expect(insights.some((insight) => insight.whyItMatters.includes("前沿 AI 平台"))).toBe(true);
    expect(insights.some((insight) => insight.whyItMatters.includes("AI 算力与芯片"))).toBe(true);
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

    expect(insights[0]?.title).toContain("特朗普访华");
    expect(insights[0]?.impactLabel).toBe("战略信号");
    expect(insights[0]?.whyItMatters).toContain("AI 芯片政策边界");
  });
});
