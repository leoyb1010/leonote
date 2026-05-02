import { ServerFilterView } from "@/components/server-filter-view";

export default function TrashPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">回收站</h1>
      <ServerFilterView type="deleted" />
    </div>
  );
}
