import { z } from "zod";
import { callChatJSON, getAISettings } from "@/lib/ai";

const organizeSchema = z.object({
  title: z.string().min(1).max(120),
  excerpt: z.string().min(1).max(220),
  cleanedContent: z.string().min(1),
  tags: z.array(z.string()).max(8).default([]),
  projectName: z.string().max(60).optional().or(z.literal("")),
  sourceType: z.string().max(32).optional(),
  actionItems: z.array(z.string()).max(8).default([]),
  memoryCandidates: z.array(z.string()).max(6).default([]),
});

export type OrganizedImport = z.infer<typeof organizeSchema>;

export async function organizeImportedContent(userId: string, input: {
  titleHint?: string;
  content: string;
  sourceUrl?: string;
  sourceType?: string;
}) {
  const settings = await getAISettings(userId);
  if (!settings.apiKey || !settings.enableAutoOrganize) {
    const raw = input.content.trim();
    return {
      title: input.titleHint || "导入笔记",
      excerpt: raw.slice(0, 120) || "暂无摘要",
      cleanedContent: raw,
      tags: ["导入"],
      projectName: "",
      sourceType: input.sourceType || "import",
      actionItems: [],
      memoryCandidates: [],
    } satisfies OrganizedImport;
  }

  const result = await callChatJSON<unknown>({
    userId,
    system: "你是个人知识库整理助手。只输出 JSON。不要编造不存在的信息。输出中文。",
    prompt: `请把下面的导入内容整理成适合个人知识库入库的结构化结果。\n要求：\n1. 标题清晰，最多 24 个中文字符左右；\n2. 摘要 1-2 句；\n3. cleanedContent 保留核心内容，去掉噪音；\n4. tags 给 3-6 个；\n5. 如果判断不出 projectName 就给空字符串；\n6. actionItems 只提取明确行动项；\n7. memoryCandidates 只提取适合长期记忆的稳定信息；\n\n输入：${JSON.stringify(input)}`,
    temperature: 0.1,
  });

  return organizeSchema.parse(result);
}
