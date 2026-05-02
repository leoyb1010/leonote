import { AccountCenter } from "@/components/account-center";
import { AISettingsPanel } from "@/components/ai-settings-panel";
import { MemoryFactsPanel } from "@/components/memory-facts-panel";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">设置</h1>
      <AccountCenter />
      <AISettingsPanel />
      <MemoryFactsPanel />
    </div>
  );
}
