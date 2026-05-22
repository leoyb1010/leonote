"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export type SummaryStatus = "idle" | "loading" | "ready" | "inserting" | "error";

type Props = {
  status: SummaryStatus;
  text: string;
  onInsert: () => void | Promise<void>;
};

export function AISummaryPanel({ status, text, onInsert }: Props) {
  const visible = (status === "ready" || status === "inserting") && Boolean(text);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.section
          layout
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
          className="mb-6 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] p-5 shadow-[var(--shadow-sm)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-[var(--ai-accent)]">静读</div>
              <h3 className="mt-1 text-sm font-medium text-[var(--text-primary)]">我整理出了一版脉络。</h3>
            </div>
            <button
              type="button"
              onClick={() => void onInsert()}
              disabled={status === "inserting"}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--hairline)] px-3 py-1.5 text-xs text-[var(--text-primary)] transition hover:bg-[var(--interactive-hover)] disabled:opacity-60"
            >
              <Sparkles className="h-3 w-3" />
              {status === "inserting" ? "插入中" : "插入"}
            </button>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">{text}</p>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}
