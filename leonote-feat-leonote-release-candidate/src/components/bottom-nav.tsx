const items = [
  { label: "首页", href: "/" },
  { label: "搜索", href: "/search" },
  { label: "每日", href: "/daily" },
  { label: "我的", href: "/settings" },
];

export function BottomNav({ current = "/" }: { current?: string }) {
  return (
    <nav className="sticky bottom-4 mt-auto grid grid-cols-4 gap-2 rounded-[24px] border border-[#e7e4de] bg-white/95 p-2 backdrop-blur md:max-w-md">
      {items.map((item) => {
        const active = current === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            className={`rounded-[18px] px-3 py-3 text-center text-sm transition-all duration-200 active:scale-[0.98] ${active ? "bg-[#111] text-white shadow-sm" : "text-[#555] hover:bg-[#f5f5f3]"}`}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
