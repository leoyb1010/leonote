import { AccountCenter } from "@/components/account-center";
import { AISettingsPanel } from "@/components/ai-settings-panel";
import { MemoryFactsPanel } from "@/components/memory-facts-panel";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { ThemeSegmentedControl } from "@/components/theme/ThemeSegmentedControl";
import Link from "next/link";
import { ArrowRight, WalletCards } from "lucide-react";

export default function SettingsPage() {
  return (
    <PageContainer width="form">
      <PageHeader title="设置" />
      <div className="space-y-6">
        <ThemeSegmentedControl />

        {/* v1.5 Ledger Entry */}
        <Link
          href="/ledger/categories"
          className="flex items-center justify-between gap-4 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-elevated)] px-4 py-4 transition-colors hover:bg-[var(--interactive-hover)]"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--interactive-hover)] text-[var(--text-muted)]">
              <WalletCards size={18} />
            </span>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">记账类型</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">给花费起一个不焦虑的名字</p>
            </div>
          </div>
          <ArrowRight size={15} className="text-[var(--text-muted)]" />
        </Link>

        <AccountCenter />
        <AISettingsPanel />
        <MemoryFactsPanel />
      </div>
    </PageContainer>
  );
}
