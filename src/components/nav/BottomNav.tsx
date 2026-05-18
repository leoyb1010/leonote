"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Boxes, FilePlus2, FolderPlus, Library, Newspaper, Plus, Sparkles, Sun, WalletCards } from "lucide-react";

interface BottomNavProps {
  currentPath: string;
}

const navItems = [
  { id: "briefing", label: "简报", icon: Newspaper, href: "/briefing" },
  { id: "today", label: "今天", icon: Sun, href: "/" },
  { id: "new", label: "", icon: Plus, href: "/notes/new", isAction: true },
  { id: "notes", label: "笔记库", icon: Library, href: "/notes" },
  { id: "ai", label: "AI", icon: Sparkles, href: "/ai" },
];

const createItems = [
  { label: "新笔记", href: "/notes/new", icon: FilePlus2 },
  { label: "装备入库", href: "/ledger", icon: Boxes },
  { label: "记一笔", href: "/ledger", icon: WalletCards },
  { label: "新项目", href: "/projects", icon: FolderPlus },
];

export function BottomNav({ currentPath }: BottomNavProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const isActive = (href: string) => {
    if (href === "/") return currentPath === "/";
    if (href === "/notes/new") return currentPath === "/notes/new";
    return currentPath.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--hairline)] bg-[var(--material-elevated)]/92 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSheetOpen(true)}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl transition-all",
                  active
                    ? "bg-[var(--primary)] text-[var(--text-primary)] shadow-lg shadow-[var(--primary-soft)]"
                    : "bg-[var(--primary-soft)] text-[var(--primary)] active:scale-95"
                )}
              >
                <Icon size={20} />
              </button>
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

      {sheetOpen ? (
        <div className="fixed inset-0 z-[60] bg-[var(--overlay-scrim)]" onClick={() => setSheetOpen(false)}>
          <div
            className="absolute inset-x-3 bottom-[calc(4rem+env(safe-area-inset-bottom))] mx-auto max-w-sm rounded-[var(--radius-2xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-2 shadow-[var(--shadow-md)]"
            onClick={(event) => event.stopPropagation()}
          >
            {createItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className="flex min-h-[48px] items-center gap-3 rounded-2xl px-4 text-sm text-[var(--text-secondary)] hover:bg-[var(--interactive-hover)] hover:text-[var(--text-primary)]"
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
