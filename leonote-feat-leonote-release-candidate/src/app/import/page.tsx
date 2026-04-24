import { AppShell } from "@/components/app-shell";
import { ImportExportPanel } from "@/components/import-export-panel";

const items = [
  {
    title: "导入 Markdown / TXT / HTML / DOCX / PDF",
    desc: "当前已支持常见文档文本导入；复杂排版会优先保留文本内容。",
    status: "已支持",
  },
  {
    title: "新闻链接 / 网页链接采集",
    desc: "粘贴链接后自动抓取标题、来源和正文摘要，沉淀为资料笔记。",
    status: "已支持",
  },
  {
    title: "附件系统",
    desc: "附件上传、预览和管理是下一阶段能力，等这轮导入链路稳定后再决定是否继续。",
    status: "待评估",
  },
];

export default function ImportPage() {
  return (
    <AppShell title="导入与迁移" subtitle="导入将直接写入数据库，导出来自当前账号的真实数据。" current="/settings">
      <ImportExportPanel />
      <section className="space-y-3">
        {items.map((item, index) => (
          <div key={item.title} className="glass-panel animate-rise rounded-[24px] p-4" style={{ animationDelay: `${index * 60}ms` }}>
            <div className="text-xs text-[#888]">{item.status}</div>
            <h2 className="mt-2 text-base font-medium">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#666]">{item.desc}</p>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
