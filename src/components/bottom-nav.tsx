import Link from "next/link";
import { BookOpen, Home, Search, Settings, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "首页", href: "/", icon: Home },
  { label: "笔记", href: "/notes", icon: BookOpen },
  { label: "搜索", href: "/search", icon: Search },
  { label: "项目", href: "/projects", icon: LayoutGrid },
  { label: "我的", href: "/settings", icon: Settings },
];

export function BottomNav({ current = "/" }: { current?: string }) {
  return (
    <nav className="sticky bottom-0 z-30 mt-auto grid grid-cols-5 gap-2 rounded-t-[20px] border-t border-[var(--border-default)] bg-[rgba(12,16,25,0.92)] p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(2,6,23,0.24)] backdrop-blur-[16px] lg:hidden safe-area-bottom">
      {items.map((item) => {
        const active = current === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-[var(--radius-sm)] px-2 py-3 text-center text-xs transition-all duration-300 active:scale-[0.97]",
              active
                ? "bg-[var(--primary)] text-[var(--text-primary)] shadow-[0_10px_24px_rgba(255,255,255,0.14)]"
                : "text-[var(--text-muted)] hover:-translate-y-[1px] hover:bg-[rgba(255,255,255,0.06)] hover:text-white",
            )}
          >
            <span className="flex flex-col items-center gap-1">
              <Icon className="h-4 w-4" />
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
