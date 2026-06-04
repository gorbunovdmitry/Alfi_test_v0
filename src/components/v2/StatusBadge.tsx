import type { StateId } from '../../data/demoStates'

const STYLES: Record<StateId, { bg: string; text: string; dot: string }> = {
  ok: { bg: 'bg-[#E8F6EE]', text: 'text-[#1E854A]', dot: 'bg-[#1E854A]' },
  risk: { bg: 'bg-[#FFF2E0]', text: 'text-[#B26A00]', dot: 'bg-[#FF8A00]' },
  bad: { bg: 'bg-[#FDEAE8]', text: 'text-alfa-red', dot: 'bg-alfa-red' },
}

export function StatusBadge({ status, label }: { status: StateId; label: string }) {
  const s = STYLES[status]
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[14px] font-semibold ${s.bg} ${s.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {label}
    </span>
  )
}
