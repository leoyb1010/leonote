"use client";

import { cn } from "@/lib/utils";

export type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const dotClass: Record<SaveState, string> = {
  idle: "bg-[var(--text-faint)]",
  dirty: "bg-[var(--text-faint)]",
  saving: "bg-[var(--warning)] animate-pulse",
  saved: "bg-[var(--success)]",
  error: "bg-[var(--danger)]",
};

const labelClass: Record<SaveState, string> = {
  idle: "",
  dirty: "",
  saving: "text-[var(--warning)]",
  saved: "text-[var(--success)]",
  error: "text-[var(--danger)]",
};

const labelText: Record<SaveState, string> = {
  idle: "",
  dirty: "有更改",
  saving: "正在安放…",
  saved: "已安静保存",
  error: "未保存",
};

type Props = {
  saveState: SaveState;
  chars: number;
};

export function SaveStateBadge({ saveState, chars }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs",
          labelClass[saveState],
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", dotClass[saveState])} />
        {labelText[saveState]}
      </span>
      {chars > 0 ? <span>{chars} 字</span> : null}
    </div>
  );
}
