interface Props {
  points: number[];
  positive: boolean;
}

export function MarketSparkline({ points, positive }: Props) {
  if (points.length < 2) return <div className="h-4 w-16 rounded-full bg-[var(--material-inset)]" />;

  const width = 64;
  const height = 18;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const d = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point - min) / range) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="overflow-visible">
      <path d={d} fill="none" stroke={positive ? "var(--success)" : "var(--danger)"} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
