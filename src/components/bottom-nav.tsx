import Link from "next/link";

const items = [
  { label: "首页", href: "/" },
  { label: "搜索", href: "/search" },
  { label: "每日", href: "/daily" },
  { label: "项目", href: "/projects" },
  { label: "我的", href: "/settings" },
];

export function BottomNav({ current = "/" }: { current?: string }) {
  return (
    <nav className="sticky bottom-4 mt-auto grid grid-cols-5 gap-2 rounded-[24px] border border-[#e7e4de] bg-white/92 p-2 shadow-[0_20px_40px_rgba(0,0,0,0.06)] backdrop-blur-xl md:max-w-xl">
      {items.map((item) => {
        const active = current === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-[18px] px-3 py-3 text-center text-sm transition-all duration-300 active:scale-[0.97] ${active ? "bg-[#111] text-white shadow-[0_10px_24px_rgba(17,17,17,0.22)]" : "text-[#555] hover:-translate-y-[1px] hover:bg-[#f5f5f3] hover:text-[#111]"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
