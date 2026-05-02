import { ServerFilterView } from "@/components/server-filter-view";

export default function ArchivePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">归档</h1>
      <ServerFilterView type="archived" />
    </div>
  );
}
