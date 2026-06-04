import { useEffect, useState } from 'react'
import type { DemoRing } from '../../data/demoStates'

const SIZE = 240
const CENTER = SIZE / 2
const STROKE = 17
const TRACK = '#EEF0F3'
const RADII = [104, 80, 56] // outer = ring[0] (Траты), middle = ring[1] (Свободный), inner = ring[2] (Цель)

export function RingsDashboard({ rings }: { rings: DemoRing[] }) {
  const [shown, setShown] = useState(false)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 264, height: 264 }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Финансовые кольца недели">
          {rings.map((_, i) => (
            <circle key={`t${i}`} cx={CENTER} cy={CENTER} r={RADII[i]} fill="none" stroke={TRACK} strokeWidth={STROKE} />
          ))}
          <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
            {rings.map((r, i) => {
              const rad = RADII[i]
              const c = 2 * Math.PI * rad
              const p = shown ? r.progress : 0
              return (
                <circle
                  key={`p${i}`}
                  cx={CENTER}
                  cy={CENTER}
                  r={rad}
                  fill="none"
                  stroke={r.color}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={c}
                  strokeDashoffset={c * (1 - Math.min(p, 0.9999))}
                  style={{ transition: 'stroke-dashoffset .95s cubic-bezier(.32,.72,0,1), opacity .2s' }}
                  opacity={active === null || active === i ? 1 : 0.3}
                />
              )
            })}
          </g>
          {rings.map((_, i) => (
            <circle
              key={`h${i}`}
              cx={CENTER}
              cy={CENTER}
              r={RADII[i]}
              fill="none"
              stroke="transparent"
              strokeWidth={STROKE + 8}
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onClick={() => setActive((a) => (a === i ? null : i))}
            />
          ))}
        </svg>
      </div>

      <p className="mt-1 min-h-[34px] max-w-[20rem] text-center text-[13px] leading-snug text-gray-mid">
        {active !== null ? rings[active].hint : 'Наведи на кольцо, чтобы понять, что оно значит.'}
      </p>

      <div className="mt-2 w-full divide-y divide-[#F1F2F5]">
        {rings.map((r, i) => (
          <button
            key={r.key}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onClick={() => setActive((a) => (a === i ? null : i))}
            className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-bg-light/50"
          >
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-semibold tracking-[-0.01em] text-graphite">{r.label}</span>
                <span className="rounded-full bg-bg-light px-2 py-0.5 text-[11px] font-medium text-gray-dark">
                  {r.statusText}
                </span>
              </span>
              <span className="mt-0.5 block text-[13px] font-medium text-gray-dark tnum">{r.valueText}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
