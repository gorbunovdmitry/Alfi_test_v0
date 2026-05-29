import { useEffect, useState } from 'react'
import type { RingId, RingState } from '../types'

const SIZE = 240
const CENTER = SIZE / 2
const STROKE = 18
const TRACK = '#EEF0F3'
const RADII: Record<RingId, number> = { spending: 104, savings: 79, goal: 54 }

type Props = {
  rings: RingState[]
  centerPercent: number
  onRingClick?: (id: RingId) => void
}

export function ActivityRings({ rings, centerPercent, onRingClick }: Props) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="relative mx-auto" style={{ width: 276, height: 276 }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`Неделя под контролем на ${centerPercent} процентов`}
      >
        {/* tracks */}
        {rings.map((r) => (
          <circle
            key={`track-${r.id}`}
            cx={CENTER}
            cy={CENTER}
            r={RADII[r.id]}
            fill="none"
            stroke={TRACK}
            strokeWidth={STROKE}
          />
        ))}

        {/* progress */}
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          {rings.map((r) => {
            const radius = RADII[r.id]
            const c = 2 * Math.PI * radius
            const p = shown ? r.progress : 0
            return (
              <circle
                key={`prog-${r.id}`}
                cx={CENTER}
                cy={CENTER}
                r={radius}
                fill="none"
                stroke={r.color}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - Math.min(p, 0.9999))}
                style={{ transition: 'stroke-dashoffset 0.95s cubic-bezier(0.32,0.72,0,1)' }}
              />
            )
          })}
        </g>

        {/* click targets */}
        {onRingClick &&
          rings.map((r) => (
            <circle
              key={`hit-${r.id}`}
              cx={CENTER}
              cy={CENTER}
              r={RADII[r.id]}
              fill="none"
              stroke="transparent"
              strokeWidth={STROKE + 7}
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
              onClick={() => onRingClick(r.id)}
            />
          ))}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="tnum text-[50px] font-bold leading-none tracking-[-0.03em] text-graphite">
          {centerPercent}%
        </div>
      </div>
    </div>
  )
}
