import Link from "next/link";
import { BottomNav } from "@/components/bottom-nav";

export function AppShell({
  title,
  subtitle,
  current,
  children,
}: {
  title: string;
  subtitle?: string;
  current?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f5f5f3] text-[#111111]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6 md:max-w-5xl md:px-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#666]">Leonote</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm leading-6 text-[#666]">{subtitle}</p> : null}
          </div>
          <div className="flex gap-2">
            <Link className="rounded-full border border-[#d8d6d1] bg-white px-4 py-2 text-sm text-[#111] shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98]" href="/search">
              搜索
            </Link>
            <Link className="rounded-full border border-[#d8d6d1] bg-white px-4 py-2 text-sm text-[#111] shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md active:scale-[0.98]" href="/notes/new">
              新建
            </Link>
          </div>
        </header>
        {children}
        <BottomNav current={current} />
      </div>
    </main>
  );
}
