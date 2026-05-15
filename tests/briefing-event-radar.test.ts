import { describe, expect, it } from "vitest";
import { buildBriefingEventRadar } from "@/lib/briefing/event-radar";
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

  it("keeps domestic, international, market, and AI events visible when all buckets exist", () => {
    const events = buildBriefingEventRadar([
      newsItem({
        id: "world",
        title: "欧盟宣布新的贸易关税方案，全球供应链成本预期上升",
        category: "world",
        sourceName: "英国广播公司中文网",
        aiSummary: "欧盟贸易政策变化可能传导到制造业、能源与全球市场预期。",
        aiTags: ["国际", "贸易"],
        aiScore: 0.88,
      }),
      newsItem({
        id: "domestic",
        title: "我国一箭 5 星发射成功，力箭系列运载火箭实现 100 星发射里程碑",
        category: "ai_tech",
        sourceName: "IT之家",
        aiSummary: "国内商业航天能力继续推进，产业链与工程能力进入新阶段。",
        aiTags: ["航天", "国内"],
        aiScore: 0.86,
      }),
      newsItem({
        id: "market",
        title: "A股三大指数午间集体上涨，半导体板块领涨",
        category: "finance",
        sourceName: "中国新闻网财经",
        aiSummary: "市场资金偏好向半导体与科技资产集中。",
        aiTags: ["市场", "半导体"],
        aiScore: 0.84,
      }),
      newsItem({
        id: "ai",
        title: "OpenAI 发布新的智能体平台，开放浏览器自动化能力",
        category: "ai_tech",
        sourceName: "OpenAI Blog",
        aiSummary: "OpenAI 把智能体能力推向更完整的任务执行入口。",
        aiTags: ["人工智能", "智能体"],
        aiScore: 0.9,
      }),
    ]);

    expect(events.map((event) => event.scope)).toEqual(expect.arrayContaining(["international", "domestic", "market", "ai_tech"]));
    expect(events.some((event) => event.scopeLabel === "国内大事")).toBe(true);
    expect(events.filter((event) => event.scope === "ai_tech")).toHaveLength(1);
  });

  it("keeps the daily radar balanced across international, domestic, and AI tech events", () => {
    const events = buildBriefingEventRadar([
      newsItem({
        id: "world-eu",
        title: "欧盟宣布新的能源进口关税方案，全球供应链成本预期上升",
        category: "world",
        sourceName: "英国广播公司中文网",
        aiSummary: "欧洲贸易政策变化可能传导到能源、制造业和全球市场预期。",
        aiTags: ["国际", "贸易"],
      }),
      newsItem({
        id: "world-us",
        title: "白宫公布中东停火谈判进展，能源运输风险暂时降温",
        category: "world",
        sourceName: "联合国新闻中文",
        aiSummary: "中东局势变化会影响能源通道、外交谈判和风险资产定价。",
        aiTags: ["国际", "能源"],
      }),
      newsItem({
        id: "world-election",
        title: "法国议会选举进入关键阶段，欧洲政策协调面临新变量",
        category: "world",
        sourceName: "ABC 国际",
        aiSummary: "欧洲主要经济体政治变化可能影响财政、移民和产业政策。",
        aiTags: ["国际", "选举"],
      }),
      newsItem({
        id: "china-policy",
        title: "国务院部署消费品以旧换新政策，国内需求侧刺激继续加码",
        category: "world",
        sourceName: "中国新闻网国际",
        aiSummary: "国内消费政策会影响零售、家电、汽车和地方财政节奏。",
        aiTags: ["国内", "政策"],
      }),
      newsItem({
        id: "china-pboc",
        title: "央行扩大科技创新再贷款支持范围，中小企业融资成本有望下降",
        category: "world",
        sourceName: "中国新闻网财经",
        aiSummary: "货币工具定向支持会影响科技企业融资、银行投放和市场预期。",
        aiTags: ["国内", "金融"],
      }),
      newsItem({
        id: "china-space",
        title: "我国商业航天新火箭完成发射，卫星互联网建设进入加速期",
        category: "world",
        sourceName: "IT之家",
        aiSummary: "国内航天工程进展会影响卫星制造、通信网络和产业链投入。",
        aiTags: ["国内", "航天"],
      }),
      newsItem({
        id: "openai-agent",
        title: "OpenAI 发布新的智能体平台，开放浏览器自动化能力",
        sourceName: "OpenAI Blog",
        aiSummary: "OpenAI 把智能体能力推向更完整的任务执行入口。",
        aiTags: ["人工智能", "智能体"],
      }),
      newsItem({
        id: "deepmind-model",
        title: "Google DeepMind 公布 Gemini 多模态推理升级",
        sourceName: "Google DeepMind",
        aiSummary: "模型能力升级可能改变企业选型、开发范式和算力需求。",
        aiTags: ["人工智能", "模型"],
      }),
      newsItem({
        id: "nvidia-chip",
        title: "英伟达 Blackwell 服务器订单继续增加，AI 数据中心投资升温",
        sourceName: "CNBC",
        aiSummary: "GPU 供应和数据中心建设继续影响云厂商成本曲线。",
        aiTags: ["算力", "芯片"],
      }),
      newsItem({
        id: "ai-security",
        title: "谷歌警告攻击者正用 AI 寻找漏洞，企业安全预算重新排序",
        sourceName: "BleepingComputer",
        aiSummary: "AI 安全事件会影响企业采购、平台开放和合规策略。",
        aiTags: ["AI安全", "企业IT"],
      }),
      newsItem({
        id: "anthropic-cloud",
        title: "Anthropic 扩大企业云合作，AI 模型进入更多内部工作流",
        sourceName: "The Verge",
        aiSummary: "企业 AI 工作流落地会改变软件入口和云服务竞争。",
        aiTags: ["人工智能", "云"],
      }),
      newsItem({
        id: "market-a",
        title: "A股三大指数午间集体上涨，半导体板块领涨",
        category: "finance",
        sourceName: "中国新闻网财经",
        aiSummary: "市场资金偏好向半导体与科技资产集中。",
        aiTags: ["市场", "半导体"],
      }),
    ]);

    const internationalCount = events.filter((event) => event.scope === "international").length;
    const domesticCount = events.filter((event) => event.scope === "domestic").length;
    const aiTechCount = events.filter((event) => event.scope === "ai_tech").length;

    expect(events).toHaveLength(8);
    expect(internationalCount).toBeGreaterThanOrEqual(1);
    expect(internationalCount).toBeLessThanOrEqual(2);
    expect(domesticCount).toBeGreaterThanOrEqual(1);
    expect(domesticCount).toBeLessThanOrEqual(2);
    expect(aiTechCount).toBeGreaterThanOrEqual(3);
    expect(aiTechCount).toBeLessThanOrEqual(5);
  });

  it("filters informal community help threads out of the event radar", () => {
    const events = buildBriefingEventRadar([
      newsItem({
        id: "linuxdo-latency",
        title: "Claude 延迟求助",
        sourceName: "LinuxDo 最新",
        aiSummary: "大佬们这个延迟为什么这么高啊？1 个帖子 - 1 位参与者",
        aiKeyPoints: [
          "大佬们这个延迟为什么这么高啊？1 个帖子 - 1 位参与者",
          "公司强制使用的是 gemini cli 进行 code，但是体验下来不是很好有些降智 2 个帖子 - 1 位参与者",
        ],
        aiTags: ["人工智能", "LinuxDo 最新"],
        aiScore: 0.95,
      }),
      newsItem({
        id: "openai-agent",
        title: "OpenAI 发布新的智能体平台，开放浏览器自动化能力",
        sourceName: "OpenAI Blog",
        aiSummary: "OpenAI 把智能体能力推向更完整的任务执行入口。",
        aiTags: ["人工智能", "智能体"],
        aiScore: 0.9,
      }),
    ]);

    expect(events.map((event) => event.title)).not.toContain("Claude 延迟求助");
    expect(events.some((event) => event.title.includes("OpenAI"))).toBe(true);
  });
});
