import { PageContainer } from "@/components/layout/PageContainer";

export default function ScheduleLoading() {
  return (
    <PageContainer width="dashboard">
      <div className="card-premium h-16 animate-pulse" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-premium h-28 animate-pulse" />
        ))}
      </div>
    </PageContainer>
  );
}
