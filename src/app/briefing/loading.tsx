export default function BriefingLoading() {
  return (
    <div className="mx-auto w-full max-w-[1480px] px-5 py-5 sm:px-6 xl:px-10 xl:py-8">
      <div className="card-premium h-72 animate-pulse" />
      <div className="mt-5 h-12 rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--material-inset)] animate-pulse" />
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <div className="card-premium h-80 animate-pulse" />
          <div className="card-premium h-[520px] animate-pulse" />
        </div>
        <div className="space-y-5">
          <div className="card-premium h-96 animate-pulse" />
          <div className="card-premium h-64 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
