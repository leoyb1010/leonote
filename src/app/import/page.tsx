import { ImportExportPanel } from "@/components/import-export-panel";
import { Card } from "@/components/base/Card";

const items = [
  { title: "导入 Markdown / TXT / HTML", desc: "当前已支持常见文本与网页源码导入。", status: "已支持" },
  { title: "新闻链接 / 网页链接采集", desc: "粘贴链接后自动抓取标题、来源和正文摘要。", status: "已支持" },
  { title: "DOCX / PDF", desc: "当前版本尚未接入可靠文本抽取，暂不宣称支持。", status: "暂不支持" },
];

export default function ImportPage() {
  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">导入与迁移</h1>
      <ImportExportPanel />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.title} padding="sm">
            <div className="text-xs text-[var(--primary)] font-medium mb-2">{item.status}</div>
            <h2 className="text-sm font-medium text-[var(--text-primary)] mb-1">{item.title}</h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{item.desc}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}
