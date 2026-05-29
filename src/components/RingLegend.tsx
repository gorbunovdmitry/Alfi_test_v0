import { ChevronRight } from 'lucide-react'
import type { RingId, RingState } from '../types'

export function RingLegend({
  rings,
  onRingClick,
}: {
  rings: RingState[]
  onRingClick: (id: RingId) => void
}) {
  return (
    <div className="divide-y divide-[#F1F2F5]">
      {rings.map((r) => (
        <button
          key={r.id}
          onClick={() => onRingClick(r.id)}
          className="flex w-full items-start gap-3 py-3.5 text-left transition active:bg-bg-light/60 tap-transparent"
        >
          <span
            className="mt-[5px] h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: r.color }}
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-[15px] font-semibold tracking-[-0.01em] text-graphite">
                {r.label}
              </span>
              <span className="rounded-full bg-bg-light px-2 py-0.5 text-[11px] font-medium text-gray-dark">
                {r.statusLabel}
              </span>
            </span>
            <span className="mt-0.5 block text-[14px] font-medium text-gray-dark tnum">
              {r.valueText}
            </span>
            <span className="mt-0.5 block text-[13px] leading-snug text-gray-mid">{r.hintText}</span>
          </span>
          <ChevronRight size={18} className="mt-1 shrink-0 text-[#C3C6CD]" />
        </button>
      ))}
    </div>
  )
}
