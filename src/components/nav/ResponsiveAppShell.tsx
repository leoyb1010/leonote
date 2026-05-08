"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="flex min-h-screen min-h-[100dvh] bg-[var(--bg-app)]">
      {/* Sidebar: full on desktop, icon rail on tablet. */}
      <DesktopSidebar
        currentPath={pathname}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Content: fills remaining space */}
      <div className="flex-1 flex flex-col min-w-0">
        {header}

        <main className="flex-1 pb-[88px] md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              variants={pageBreathIn}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Bottom Nav: only phone-size layouts. */}
      <BottomNav currentPath={pathname} />
    </div>
  );
}
