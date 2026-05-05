import { AccountCenter } from "@/components/account-center";
import { AISettingsPanel } from "@/components/ai-settings-panel";
import { MemoryFactsPanel } from "@/components/memory-facts-panel";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

export default function SettingsPage() {
  return (
    <PageContainer width="form">
      <PageHeader title="设置" />
      <div className="space-y-6">
        <AccountCenter />
        <AISettingsPanel />
        <MemoryFactsPanel />
      </div>
    </PageContainer>
  );
}
