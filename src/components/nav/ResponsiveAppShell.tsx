"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { DesktopSidebar } from "./DesktopSidebar";
import { BottomNav } from "./BottomNav";

interface ResponsiveAppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
}

export function ResponsiveAppShell({ children, header }: ResponsiveAppShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-[var(--bg-app)]">
      {/* Sidebar: fixed on left, hidden below xl (1280px), collapsible */}
      <DesktopSidebar
        currentPath={pathname}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Content: fills remaining space */}
      <div className="flex-1 flex flex-col min-w-0">
        {header}

        <main className="flex-1 pb-20 xl:pb-0">
          <div className="w-full px-4 sm:px-6 xl:px-8 py-4 xl:py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Nav: shown below xl */}
      <BottomNav currentPath={pathname} />
    </div>
  );
}
