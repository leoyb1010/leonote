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
    <nav className="safe-top-nav sticky top-3 z-30 mb-4 grid grid-cols-5 gap-1.5 rounded-[18px] border border-white/10 bg-[rgba(12,16,25,0.86)] p-1.5 shadow-[0_16px_48px_rgba(2,6,23,0.26)] backdrop-blur-2xl lg:hidden">
      {items.map((item) => {
        const active = current === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-[14px] px-1.5 py-2 text-center text-[11px] transition-all duration-300 active:scale-[0.97]",
              active
                ? "bg-white text-slate-950 shadow-[0_8px_18px_rgba(255,255,255,0.12)]"
                : "text-white/54 hover:bg-white/6 hover:text-white",
            )}
          >
            <span className="flex flex-col items-center gap-0.5">
              <Icon className="h-4 w-4" />
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
