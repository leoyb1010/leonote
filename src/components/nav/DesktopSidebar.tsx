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
  { id: "today", label: "Today", icon: <Sun size={18} />, href: "/" },
  { id: "notes", label: "Notes", icon: <FileText size={18} />, href: "/notes" },
  {
    id: "projects",
    label: "Projects",
    icon: <FolderKanban size={18} />,
    href: "/projects",
  },
  { id: "ai", label: "AI", icon: <Sparkles size={18} />, href: "/ai" },
];

const bottomItems: NavItem[] = [
  {
    id: "settings",
    label: "设置",
    icon: <Settings size={18} />,
    href: "/settings",
  },
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
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
      className="hidden lg:flex flex-col shrink-0 h-screen sticky top-0 border-r border-[var(--border-default)] bg-[var(--surface-base)]"
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center h-14 px-4 border-b border-[var(--border-default)]",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-semibold text-[var(--text-primary)] tracking-tight"
          >
            Leonote
          </motion.span>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
          aria-label={collapsed ? "展开侧栏" : "收起侧栏"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
              "hover:bg-[rgba(255,255,255,0.06)]",
              collapsed && "justify-center px-0",
              isActive(item.href)
                ? "text-[var(--primary)] bg-[var(--primary-soft)]"
                : "text-[var(--text-secondary)]"
            )}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="truncate"
              >
                {item.label}
              </motion.span>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom Nav */}
      <div className="py-3 px-2 space-y-1 border-t border-[var(--border-default)]">
        {bottomItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
              "hover:bg-[rgba(255,255,255,0.06)]",
              collapsed && "justify-center px-0",
              isActive(item.href)
                ? "text-[var(--primary)] bg-[var(--primary-soft)]"
                : "text-[var(--text-secondary)]"
            )}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="truncate"
              >
                {item.label}
              </motion.span>
            )}
          </Link>
        ))}
      </div>

      {/* User */}
      <div className="px-2 pb-4">
        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm",
            "hover:bg-[rgba(255,255,255,0.06)] transition-colors",
            collapsed && "justify-center px-0",
            "text-[var(--text-muted)]"
          )}
        >
          <User size={18} />
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="truncate"
            >
              账户
            </motion.span>
          )}
        </Link>
      </div>
    </motion.aside>
  );
}
