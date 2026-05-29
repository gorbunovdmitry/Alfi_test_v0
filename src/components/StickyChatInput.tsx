import { ArrowUp } from 'lucide-react'
import { Chip } from './ui/Chip'
import { AlfiAvatar } from './AlfiAvatar'
import { CHAT_SUGGESTIONS } from '../lib/chatSuggestions'

export function StickyChatInput({ onOpenChat }: { onOpenChat: (prompt?: string) => void }) {
  return (
    <div className="shrink-0 border-t border-[#EEEFF2] bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
      <div className="no-scrollbar -mx-4 mb-2.5 flex gap-2 overflow-x-auto px-4">
        {CHAT_SUGGESTIONS.map((p) => (
          <Chip key={p} onClick={() => onOpenChat(p)}>
            {p}
          </Chip>
        ))}
      </div>
      <button
        onClick={() => onOpenChat()}
        className="flex w-full items-center gap-3 rounded-full border border-[#ECEDF0] bg-bg-light px-3 py-2.5 text-left transition active:scale-[0.99] tap-transparent"
      >
        <AlfiAvatar size={30} />
        <span className="flex-1 text-[15px] text-gray-mid">Спросить Альфи…</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-alfa-red text-white">
          <ArrowUp size={18} strokeWidth={2.4} />
        </span>
      </button>
    </div>
  )
}
