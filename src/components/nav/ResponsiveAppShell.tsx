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

  // Login page doesn't get shell
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh] bg-[var(--bg-app)]">
      {/* Desktop Sidebar */}
      <DesktopSidebar
        currentPath={pathname}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Optional header */}
        {header}

        {/* Content */}
        <main className="flex-1 pb-20 lg:pb-0">
          <div className="mx-auto max-w-[var(--page-max)] px-4 md:px-6 lg:px-8 py-4 lg:py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav currentPath={pathname} />
    </div>
  );
}
