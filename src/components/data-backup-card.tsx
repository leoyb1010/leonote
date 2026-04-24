export function DataBackupCard() {
  return (
    <section className="rounded-[24px] bg-white p-5 text-sm leading-7 text-[#555]">
      <h2 className="text-base font-medium text-[#111]">数据与备份</h2>
      <p className="mt-3">当前版本采用 Leonote 自己的数据存储，不直接依赖 Apple 备忘录做同步主链。</p>
      <p className="mt-2">原因很简单：Apple 备忘录缺少稳定公开同步接口，直接同步长期看不稳。</p>
      <p className="mt-2">更合理的方向是：</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-[#666]">
        <li>Leonote 自己做主存储</li>
        <li>支持导入 Markdown / TXT / 导出备份</li>
        <li>后续可做 Apple 备忘录迁移工具，而不是强绑定同步</li>
      </ul>
    </section>
  );
}
