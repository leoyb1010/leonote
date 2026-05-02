"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Sun, FileText, FolderKanban, Sparkles, Plus } from "lucide-react";

interface BottomNavProps {
  currentPath: string;
}

const navItems = [
  { id: "today", label: "Today", icon: Sun, href: "/" },
  { id: "notes", label: "Notes", icon: FileText, href: "/notes" },
  { id: "new", label: "", icon: Plus, href: "/notes/new", isAction: true },
  { id: "projects", label: "项目", icon: FolderKanban, href: "/projects" },
  { id: "ai", label: "AI", icon: Sparkles, href: "/ai" },
];

export function BottomNav({ currentPath }: BottomNavProps) {
  const isActive = (href: string) => {
    if (href === "/") return currentPath === "/";
    if (href === "/notes/new") return currentPath === "/notes/new";
    return currentPath.startsWith(href);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface-overlay)] border-t border-[var(--border-default)] backdrop-blur-[12px] safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl transition-all",
                  active
                    ? "bg-[var(--primary)] text-[var(--text-primary)] shadow-lg shadow-[var(--primary-soft)]"
                    : "bg-[var(--primary-soft)] text-[var(--primary)] active:scale-95"
                )}
              >
                <Icon size={20} />
              </Link>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-0 px-2 py-1 rounded-lg transition-colors",
                active
                  ? "text-[var(--primary)]"
                  : "text-[var(--text-muted)]"
              )}
            >
              <Icon size={18} />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
