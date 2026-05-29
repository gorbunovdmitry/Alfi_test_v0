import { Sparkles } from 'lucide-react'

export function AlfiAvatar({ size = 36 }: { size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: '#EF3124',
        boxShadow: '0 6px 16px rgba(239,49,36,0.28)',
      }}
    >
      <Sparkles size={Math.round(size * 0.5)} className="text-white" strokeWidth={2.2} />
    </span>
  )
}
