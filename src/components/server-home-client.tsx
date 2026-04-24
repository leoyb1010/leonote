import Link from "next/link";

const quickActions = [
  { label: "继续记录", href: "/notes/new" },
  { label: "搜索", href: "/search" },
  { label: "收藏", href: "/favorites" },
  { label: "每日", href: "/daily" },
];

type HomeViewData = {
  recent: Array<{ id: string; title: string; excerpt: string; tags: string[]; updatedAt: string }>;
  tags: string[];
  counts: { favorite: number; pinned: number; total: number };
  projects: Array<{ id: string; name: string; description: string; noteCount: number; updatedAt: string }>;
};

export function ServerHomeClient({ data, signedIn }: { data: HomeViewData | null; signedIn: boolean }) {
  if (!signedIn) {
    return <section className="glass-panel animate-rise rounded-[28px] p-5 text-sm leading-6 text-[#666]">当前未登录。先去 <Link href="/login" className="font-medium text-[#111] underline underline-offset-4">登录</Link>，再进入你的工作台。</section>;
  }

  if (!data) {
    return <section className="glass-panel animate-rise rounded-[28px] p-5 text-sm leading-6 text-[#666]">正在准备工作台…</section>;
  }

  return (
    <>
      <section className="glass-panel animate-rise mb-6 rounded-[28px] p-5 transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
        <p className="mb-3 text-sm text-[#666]">Today</p>
        <Link href="/notes/new" className="block rounded-2xl bg-[#f7f7f5] p-4 text-sm text-[#666] transition-all duration-200 hover:bg-white hover:shadow-[0_0_0_1px_rgba(17,17,17,0.06)]">现在想记什么？直接开始。</Link>
        <div className="mt-4 grid grid-cols-4 gap-2">{quickActions.map((item) => <Link key={item.label} href={item.href} className="rounded-2xl bg-[#f3f2ef] px-3 py-3 text-center text-xs text-[#333] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#ebe8e1] active:scale-[0.98]">{item.label}</Link>)}</div>
      </section>

      <section className="mb-6 grid grid-cols-3 gap-3">
        <div className="glass-panel rounded-[24px] p-4 text-center"><div className="text-2xl font-semibold">{data.counts.total}</div><div className="mt-1 text-xs text-[#777]">最近活跃</div></div>
        <div className="glass-panel rounded-[24px] p-4 text-center"><div className="text-2xl font-semibold">{data.counts.favorite}</div><div className="mt-1 text-xs text-[#777]">收藏</div></div>
        <div className="glass-panel rounded-[24px] p-4 text-center"><div className="text-2xl font-semibold">{data.counts.pinned}</div><div className="mt-1 text-xs text-[#777]">置顶</div></div>
      </section>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between"><div className="text-sm font-medium">Focus / 项目推进</div><Link href="/projects" className="text-xs text-[#777]">查看全部</Link></div>
        <div className="space-y-3">{data.projects.length ? data.projects.map((project) => <Link key={project.id} href={`/notes?projectId=${project.id}`} className="glass-panel block rounded-[24px] p-4 transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_14px_32px_rgba(0,0,0,0.06)]"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-medium text-[#111]">{project.name}</h3><span className="rounded-full bg-[#f3f2ef] px-3 py-1 text-xs text-[#666]">{project.noteCount} 条</span></div><p className="mt-2 text-sm leading-6 text-[#666]">{project.description || "继续推进这个项目的记录与沉淀。"}</p></Link>) : <div className="glass-panel rounded-[24px] p-4 text-sm text-[#666]">还没有项目，去项目页创建第一个项目。</div>}</div>
      </section>

      <section className="mb-6">
        <div className="mb-3 text-sm font-medium">常用标签</div>
        <div className="flex gap-2 overflow-x-auto pb-1">{(data.tags.length ? data.tags : ["暂无标签"]).map((tag, index) => <Link key={tag} href={tag === "暂无标签" ? "/notes" : `/notes?tag=${encodeURIComponent(tag)}`} className={`shrink-0 rounded-full px-4 py-2 text-sm ${index === 0 ? "bg-[#111] text-white" : "border border-[#e7e4de] bg-white text-[#555]"}`}>{tag}</Link>)}</div>
      </section>

      <section className="mb-4 flex items-center justify-between"><h2 className="text-lg font-medium">Recent</h2><Link className="text-sm text-[#777]" href="/notes">查看全部</Link></section>
      {data.recent.length === 0 ? <section className="glass-panel rounded-[24px] p-5 text-sm leading-6 text-[#666]">还没有笔记，先创建第一条记录。</section> : null}
      <section className="space-y-3">{data.recent.map((note) => <Link key={note.id} href={`/notes/${note.id}`} className="glass-panel block rounded-[24px] p-4 transition-all duration-300 hover:-translate-y-[1px] hover:shadow-[0_14px_32px_rgba(0,0,0,0.06)]"><div className="mb-3 flex items-center justify-between gap-3"><div className="inline-flex rounded-full bg-[#f1efe9] px-2 py-1 text-xs text-[#666]">{note.tags[0] || "未分类"}</div><span className="text-xs text-[#888]">{new Date(note.updatedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span></div><h3 className="text-base font-medium text-[#111]">{note.title}</h3><p className="mt-2 text-sm leading-6 text-[#666]">{note.excerpt}</p></Link>)}</section>
    </>
  );
}
