import { AppShell } from "@/components/app-shell";
import { ImportExportPanel } from "@/components/import-export-panel";

const items = [
  {
    title: "导入 Markdown / TXT / HTML",
    desc: "当前已支持常见文本与网页源码导入。",
    status: "已支持",
  },
  {
    title: "新闻链接 / 网页链接采集",
    desc: "粘贴链接后自动抓取标题、来源和正文摘要，沉淀为资料笔记；已限制本地/内网地址。",
    status: "已支持",
  },
  {
    title: "DOCX / PDF",
    desc: "当前版本尚未接入可靠文本抽取，暂不宣称支持，避免导入坏数据。",
    status: "暂不支持",
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
