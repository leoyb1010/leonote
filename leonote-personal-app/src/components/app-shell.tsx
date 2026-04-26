import Link from "next/link";
import type { ReactNode } from "react";
import { Plus, Search, Settings } from "lucide-react";
import { AnimatedSidebar } from "@/components/layout/AnimatedSidebar";
import { AISpark } from "@/components/ui/AISpark";
import { GlassPanel } from "@/components/ui/GlassPanel";
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
  children: ReactNode;
}) {
  return (
    <main className="min-h-app min-h-screen bg-transparent text-white">
      <div className="app-safe-shell mx-auto flex min-h-app min-h-screen w-full max-w-[1600px] gap-5 px-3 md:px-6 lg:px-8">
        <AnimatedSidebar current={current} />

        <div className="relative flex min-h-app min-h-screen min-w-0 flex-1 flex-col">
          <AISpark density={10} subdued className="opacity-30" />
          <GlassPanel blur="xl" glow="soft" className="noise-mask relative flex min-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-[24px] px-3 py-3 sm:px-5 md:px-6 lg:rounded-[28px] lg:px-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_62%)]" />
            <BottomNav current={current} />
            <header className="relative z-10 mb-4 flex flex-col gap-3 border-b border-white/8 pb-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">Leonote</p>
                <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">{title}</h1>
                {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">{subtitle}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <Link className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-xs text-white/58 transition-all duration-200 hover:bg-white/8 hover:text-white active:scale-[0.98]" href="/search">
                  <Search className="h-4 w-4" /> 搜索
                </Link>
                <Link className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-2 text-xs text-white/58 transition-all duration-200 hover:bg-white/8 hover:text-white active:scale-[0.98]" href="/settings">
                  <Settings className="h-4 w-4" /> 设置
                </Link>
                <Link className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 shadow-[0_8px_22px_rgba(255,255,255,0.12)] transition-all duration-200 hover:brightness-110 active:scale-[0.98]" href="/notes/new">
                  <Plus className="h-4 w-4" /> 新建笔记
                </Link>
              </div>
            </header>

            <div className="app-safe-content relative z-10 flex-1 lg:pb-0">{children}</div>
          </GlassPanel>
        </div>
      </div>
    </main>
  );
}
