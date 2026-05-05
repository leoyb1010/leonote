import Link from "next/link";
import type { ReactNode } from "react";
import { Bell, Plus, Search } from "lucide-react";
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
    <main className="min-h-screen bg-transparent text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-6 px-4 py-4 md:px-6 lg:px-8">
        <AnimatedSidebar current={current} />

        <div className="relative flex min-h-screen min-w-0 flex-1 flex-col">
          <AISpark density={10} subdued className="opacity-30" />
          <GlassPanel blur="xl" className="noise-mask relative flex min-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[32px] px-4 py-4 sm:px-5 md:px-6 lg:px-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_62%)]" />
            <header className="relative z-10 mb-6 flex flex-col gap-4 border-b border-[var(--border-default)] pb-5 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--text-muted)]">Leonote</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] md:text-4xl">{title}</h1>
                {subtitle ? <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-muted)] md:text-[15px]">{subtitle}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[rgba(255,255,255,0.10)] hover:text-white active:scale-[0.98]" href="/search">
                  <Search className="h-4 w-4" /> 搜索
                </Link>
                <Link className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[rgba(255,255,255,0.06)] px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[rgba(255,255,255,0.10)] hover:text-white active:scale-[0.98]" href="/settings">
                  <Bell className="h-4 w-4" /> 设置
                </Link>
                <Link className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] text-white px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_24px_rgba(255,255,255,0.14)] transition-all duration-200 hover:-translate-y-[1px] hover:brightness-110 active:scale-[0.98]" href="/notes/new">
                  <Plus className="h-4 w-4" /> 新建
                </Link>
              </div>
            </header>

            <div className="relative z-10 flex-1 pb-24 lg:pb-0">{children}</div>

            <BottomNav current={current} />
          </GlassPanel>
        </div>
      </div>
    </main>
  );
}
