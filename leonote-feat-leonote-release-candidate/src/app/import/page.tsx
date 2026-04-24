import { AppShell } from "@/components/app-shell";
import { ImportExportPanel } from "@/components/import-export-panel";

const items = [
  {
    title: "导入 Markdown / TXT",
    desc: "当前已经支持标准文本与 Markdown 文件导入。",
    status: "已支持",
  },
  {
    title: "从 Apple 备忘录迁移",
    desc: "Apple 备忘录没有稳定公开同步接口，通常需要通过导出或快捷指令中转。",
    status: "需定制",
  },
  {
    title: "同步到 Apple 备忘录",
    desc: "不建议直接依赖 Apple 备忘录做主存储，同步链路不稳定，后续可做导出。",
    status: "暂不建议",
  },
];

export default function ImportPage() {
  return (
    <AppShell title="导入与迁移" subtitle="导入将直接写入数据库，导出来自当前账号的真实数据。" current="/settings">
      <ImportExportPanel />
      <section className="space-y-3">
        {items.map((item) => (
          <div key={item.title} className="rounded-[24px] border border-[#e7e4de] bg-white p-4">
            <div className="text-xs text-[#888]">{item.status}</div>
            <h2 className="mt-2 text-base font-medium">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#666]">{item.desc}</p>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
