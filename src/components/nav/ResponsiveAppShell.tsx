"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { DesktopSidebar } from "./DesktopSidebar";
import { BottomNav } from "./BottomNav";
import { pageBreathIn } from "@/lib/animations";

interface ResponsiveAppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
}

export function ResponsiveAppShell({ children, header }: ResponsiveAppShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const syncSidebarMode = () => setSidebarCollapsed(window.innerWidth < 1280);
    syncSidebarMode();
    window.addEventListener("resize", syncSidebarMode);
    return () => window.removeEventListener("resize", syncSidebarMode);
  }, []);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh] min-w-0 overflow-x-clip bg-[var(--bg-app)]">
      {/* Sidebar: full on desktop, icon rail on tablet. */}
      <DesktopSidebar
        currentPath={pathname}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Content: fills remaining space */}
      <div className="flex min-w-0 flex-1 flex-col">
        {header}

        <main className="min-w-0 flex-1 pb-[calc(56px+env(safe-area-inset-bottom)+16px)] md:!pb-0">
          <motion.div
            key={pathname}
            variants={pageBreathIn}
            initial="initial"
            animate="animate"
            className="min-w-0"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Bottom Nav: only phone-size layouts. */}
      <BottomNav currentPath={pathname} />
    </div>
  );
}
