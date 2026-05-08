import { describe, expect, it } from "vitest";
import { categoryLabel, deriveDisplayCategory, isDisplayableChinese, marketDisplayName, needsChineseDisplay, sourceDisplayName } from "@/lib/briefing/display";

describe("briefing display rules", () => {
  it("keeps briefing labels in Chinese", () => {
    expect(categoryLabel("ai_tech")).toBe("人工智能");
    expect(sourceDisplayName("TechCrunch AI", "ai_tech")).toBe("海外科技媒体");
    expect(sourceDisplayName("Tavily · AI 科技", "ai_tech")).toBe("聚合资讯 · 人工智能");
    expect(marketDisplayName({ symbol: "BTC-USD", name: "BTC" })).toBe("比特币");
  });

  it("detects English-only news as not ready for the main list", () => {
    expect(needsChineseDisplay("OpenAI launches a new agent platform")).toBe(true);
    expect(isDisplayableChinese("OpenAI launches a new agent platform", "中文摘要已经生成")).toBe(false);
    expect(isDisplayableChinese("OpenAI 发布新的智能体平台", "中文摘要已经生成")).toBe(true);
    expect(isDisplayableChinese("世界新闻与国际头条 | NPR", "中文摘要已经生成")).toBe(false);
  });

  it("classifies broad business feeds before rendering", () => {
    expect(deriveDisplayCategory({ category: "ai_tech", sourceName: "36氪", title: "南向资金净买入额达100亿港元" })).toBe("finance");
    expect(deriveDisplayCategory({ category: "ai_tech", sourceName: "36氪", title: "千问AI眼镜升级主动服务能力" })).toBe("ai_tech");
  });
});
