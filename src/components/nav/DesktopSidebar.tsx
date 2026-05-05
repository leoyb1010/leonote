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
  { id: "today", label: "今天", icon: <Sun size={18} />, href: "/" },
  { id: "notes", label: "笔记", icon: <FileText size={18} />, href: "/notes" },
  { id: "projects", label: "项目", icon: <FolderKanban size={18} />, href: "/projects" },
  { id: "ai", label: "AI", icon: <Sparkles size={18} />, href: "/ai" },
];

const bottomItems: NavItem[] = [
  { id: "settings", label: "设置", icon: <Settings size={18} />, href: "/settings" },
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
      animate={{ width: collapsed ? 56 : 224 }}
      transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
      className="hidden xl:flex flex-col shrink-0 h-screen sticky top-0 border-r border-[var(--border-subtle)] bg-[var(--bg-app)]"
    >
      {/* Header: logo only */}
      <div
        className={cn(
          "flex items-center h-12 px-4",
          collapsed ? "justify-center" : "justify-start"
        )}
      >
        {!collapsed && (
          <span className="text-sm font-medium tracking-[-0.02em] text-[var(--text-primary)]">
            Leonote
          </span>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-[background-color,color] duration-[var(--duration-quick)]",
              "hover:bg-[rgba(255,255,255,0.035)]",
              collapsed && "justify-center px-0",
              isActive(item.href)
                ? "bg-[rgba(255,255,255,0.045)] text-[var(--text-primary)] before:absolute before:left-0 before:top-[22%] before:bottom-[22%] before:w-[2px] before:rounded-r-full before:bg-[var(--primary)]"
                : "text-[var(--text-secondary)]"
            )}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Bottom: settings + user + fold */}
      <div className="py-3 px-2 space-y-1 border-t border-[var(--border-subtle)]">
        {bottomItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-[background-color,color] duration-[var(--duration-quick)]",
              "hover:bg-[rgba(255,255,255,0.035)]",
              collapsed && "justify-center px-0",
              isActive(item.href)
                ? "bg-[rgba(255,255,255,0.045)] text-[var(--text-primary)] before:absolute before:left-0 before:top-[22%] before:bottom-[22%] before:w-[2px] before:rounded-r-full before:bg-[var(--primary)]"
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
            "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors duration-[var(--duration-quick)]",
            "hover:bg-[rgba(255,255,255,0.035)]",
            collapsed && "justify-center px-0",
            "text-[var(--text-muted)]"
          )}
        >
          <User size={18} />
          {!collapsed && <span className="truncate">账户</span>}
        </Link>
      </div>

      {/* Fold button at bottom */}
      <div className="px-2 pb-4">
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors duration-[var(--duration-quick)]",
            "hover:bg-[rgba(255,255,255,0.035)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
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
