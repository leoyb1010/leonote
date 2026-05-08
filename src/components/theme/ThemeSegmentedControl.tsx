"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "./ThemeProvider";

const options: Array<{
  value: ThemePreference;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Auto", icon: Monitor },
];

export function ThemeSegmentedControl() {
  const { theme, resolvedTheme, setTheme, mounted } = useTheme();

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-base)] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-medium text-[var(--text-primary)]">外观</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]" suppressHydrationWarning>
            当前生效：{mounted ? (resolvedTheme === "dark" ? "暗色" : "亮色") : "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-subtle)] p-1">
        {options.map((option) => {
          const Icon = option.icon;
          const active = theme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={[
                "inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--surface-base)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface-base)] hover:text-[var(--text-primary)]",
              ].join(" ")}
              aria-pressed={active}
            >
              <Icon size={16} />
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
