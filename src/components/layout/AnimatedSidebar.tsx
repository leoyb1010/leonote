"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, BrainCircuit, FolderKanban, Home, PanelLeft, Search, Settings, Sparkles } from "lucide-react";
import { AISpark } from "@/components/ui/AISpark";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { sidebarCollapse, staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";

type SidebarItem = {
  label: string;
  href: string;
  icon: typeof Home;
  pulse?: boolean;
};

type AnimatedSidebarProps = {
  current?: string;
};

const items: SidebarItem[] = [
  { label: "首页", href: "/", icon: Home },
  { label: "笔记", href: "/notes", icon: BookOpen },
  { label: "搜索", href: "/search", icon: Search },
  { label: "项目", href: "/projects", icon: FolderKanban },
  { label: "记忆", href: "/favorites", icon: BrainCircuit, pulse: true },
  { label: "设置", href: "/settings", icon: Settings },
];

export function AnimatedSidebar({ current = "/" }: AnimatedSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const memoryIndex = useMemo(() => items.findIndex((item) => item.pulse), []);

  return (
    <motion.aside
      variants={sidebarCollapse}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="whileHover"
      whileTap="whileTap"
      className={cn("sticky top-6 hidden self-start lg:block", collapsed ? "w-[88px]" : "w-[288px]")}
    >
      <GlassPanel blur="xl" glow="brand" hoverGlow className="min-h-[calc(100vh-3rem)] rounded-[28px] p-4">
        <AISpark className="opacity-50" density={9} subdued />
        <div className="relative z-10 flex h-full flex-col">
          <div className="mb-6 flex items-center justify-between gap-3 px-1">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.26em] text-white/45">Leonote</div>
              <AnimatePresence initial={false}>
                {!collapsed ? (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="mt-2 text-sm text-white/68">
                    安静发光的第二大脑
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label={collapsed ? "展开侧边栏" : "折叠侧边栏"}
            >
              <PanelLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
            </button>
          </div>

          <motion.nav variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
            {items.map((item, index) => {
              const Icon = item.icon;
              const active = current === item.href;
              return (
                <motion.div key={item.href} variants={staggerItem}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 overflow-hidden rounded-[20px] px-3 py-3 text-sm transition duration-300",
                      active
                        ? "bg-white/10 text-white shadow-[0_10px_32px_rgba(15,23,42,0.24)]"
                        : "text-white/58 hover:bg-white/6 hover:text-white",
                    )}
                  >
                    {item.pulse && index === memoryIndex ? (
                      <motion.span
                        className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.30),transparent_68%)]"
                        animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.68, 0.35] }}
                        transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                      />
                    ) : null}
                    <span className="relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6">
                      <Icon className="h-4 w-4" />
                    </span>
                    {!collapsed ? (
                      <div className="relative z-10 min-w-0 flex-1">
                        <div className="truncate font-medium">{item.label}</div>
                        <div className="truncate text-xs text-white/42">{item.pulse ? "Memory signal active" : "Workspace"}</div>
                      </div>
                    ) : null}
                  </Link>
                </motion.div>
              );
            })}
          </motion.nav>

          <div className="mt-auto px-1 pt-6">
            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm text-white/82">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                {!collapsed ? "Memory Ready" : null}
              </div>
              {!collapsed ? <p className="mt-2 text-xs leading-6 text-white/50">AI、记忆、项目沉淀统一在一个静谧工作流里。</p> : null}
            </div>
          </div>
        </div>
      </GlassPanel>
    </motion.aside>
  );
}
