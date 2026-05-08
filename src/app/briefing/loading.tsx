export default function BriefingLoading() {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="card-premium h-52 animate-pulse" />
      <div className="mt-4 card-premium h-24 animate-pulse" />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="card-premium h-96 animate-pulse" />
        <div className="card-premium h-96 animate-pulse" />
        <div className="card-premium h-96 animate-pulse" />
      </div>
    </div>
  );
}
