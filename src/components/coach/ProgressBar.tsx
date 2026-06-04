export function ProgressBar({
  fraction,
  color = '#1E854A',
  height = 10,
}: {
  fraction: number
  color?: string
  height?: number
}) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-[#EEF0F3]"
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}
