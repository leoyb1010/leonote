"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sun,
  FileText,
  FolderKanban,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const navItems: NavItem[] = [
  { id: "today", label: "今天", icon: <Sun size={20} />, href: "/" },
  { id: "notes", label: "笔记", icon: <FileText size={20} />, href: "/notes" },
  { id: "projects", label: "项目", icon: <FolderKanban size={20} />, href: "/projects" },
  { id: "ai", label: "AI", icon: <Sparkles size={20} />, href: "/ai" },
];

const bottomItems: NavItem[] = [
  { id: "settings", label: "设置", icon: <Settings size={20} />, href: "/settings" },
];

interface DesktopSidebarProps {
  currentPath: string;
  collapsed: boolean;
  onToggle: () => void;
}

export function DesktopSidebar({
  currentPath,
  collapsed,
  onToggle,
}: DesktopSidebarProps) {
  const isActive = (href: string) => {
    if (href === "/") return currentPath === "/";
    return currentPath.startsWith(href);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 264 }}
      transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
      className="hidden xl:flex 2xl:[--sidebar-width:288px] 2xl:!w-[288px] flex-col shrink-0 h-screen sticky top-0 border-r border-[var(--hairline)] bg-[var(--bg-app)]/95"
    >
      {/* Header: Logo + subtitle */}
      <div
        className={cn(
          "px-4 pt-5 pb-3",
          collapsed && "px-0 flex justify-center pt-5 pb-3"
        )}
      >
        {!collapsed ? (
          <>
            <div className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Leonote</div>
            <div className="mt-1 text-xs text-[var(--text-muted)] leading-relaxed">安静保存你的长期思考</div>
          </>
        ) : (
          <div className="text-[15px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">L</div>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[44px] text-[15px] transition-[background-color,color,transform] duration-[var(--duration-quick)]",
              "hover:bg-[var(--interactive-hover)] active:scale-[0.995]",
              collapsed && "justify-center px-0 min-h-[44px]",
              isActive(item.href)
                ? "bg-[var(--interactive-selected)] text-[var(--text-primary)] before:absolute before:left-0 before:top-[22%] before:bottom-[22%] before:w-[2px] before:rounded-r-full before:bg-[var(--primary)]"
                : "text-[var(--text-secondary)]"
            )}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Bottom: settings + user + fold */}
      <div className="py-2 px-2 space-y-0.5 border-t border-[var(--hairline)]">
        {bottomItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[44px] text-[15px] transition-[background-color,color] duration-[var(--duration-quick)]",
              "hover:bg-[var(--interactive-hover)]",
              collapsed && "justify-center px-0 min-h-[44px]",
              isActive(item.href)
                ? "bg-[var(--interactive-selected)] text-[var(--text-primary)] before:absolute before:left-0 before:top-[22%] before:bottom-[22%] before:w-[2px] before:rounded-r-full before:bg-[var(--primary)]"
                : "text-[var(--text-secondary)]"
            )}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        ))}

        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[44px] text-[15px] transition-colors duration-[var(--duration-quick)]",
            "hover:bg-[var(--interactive-hover)]",
            collapsed && "justify-center px-0 min-h-[44px]",
            "text-[var(--text-muted)]"
          )}
        >
          <User size={20} />
          {!collapsed && <span className="truncate">账户</span>}
        </Link>
      </div>

      {/* Fold button at bottom */}
      <div className="px-2 pb-4">
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[44px] text-[15px] transition-colors duration-[var(--duration-quick)]",
            "hover:bg-[var(--interactive-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
            collapsed && "justify-center px-0"
          )}
          aria-label={collapsed ? "展开侧栏" : "收起侧栏"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="truncate">收起</span>}
        </button>
      </div>
    </motion.aside>
  );
}
