import { PageContainer } from "@/components/layout/PageContainer";

export default function BriefingLoading() {
  return (
    <PageContainer width="dashboard">
      <div className="card-premium h-72 animate-pulse" />
      <div className="mt-5 h-12 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-inset)] animate-pulse" />
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5 lg:space-y-6">
          <div className="card-premium h-80 animate-pulse" />
          <div className="card-premium h-[520px] animate-pulse" />
        </div>
        <div className="space-y-4 lg:space-y-5">
          <div className="card-premium h-96 animate-pulse" />
          <div className="card-premium h-64 animate-pulse" />
        </div>
      </div>
    </PageContainer>
  );
}
