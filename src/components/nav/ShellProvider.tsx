"use client";

import React from "react";
import { CommandPalette } from "./CommandPalette";
import { usePathname } from "next/navigation";
import { ResponsiveAppShell } from "./ResponsiveAppShell";
import { GlobalAIAssistant } from "@/components/ai/GlobalAIAssistant";

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Login page: no shell
  if (pathname === "/login") {
    return (
      <>
        {children}
        <CommandPalette />
      </>
    );
  }

  // All other pages: wrap in shell
  return (
    <>
      <ResponsiveAppShell>{children}</ResponsiveAppShell>
      <CommandPalette />
      <GlobalAIAssistant />
    </>
  );
}
