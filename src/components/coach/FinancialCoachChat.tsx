import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowUp } from 'lucide-react'
import type { ChatMessage } from '../../types/coach'
import { AlfiAvatar } from '../AlfiAvatar'

/** Inline **bold** parsing. */
function renderInline(text: string, keyBase: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((seg, j) =>
    j % 2 === 1 ? <strong key={`${keyBase}-${j}`}>{seg}</strong> : <span key={`${keyBase}-${j}`}>{seg}</span>,
  )
}

/** Lightweight Markdown: headings → bold label, bullets, numbered, tables degraded, bold. */
function renderMarkdown(text: string): ReactNode {
  const lines = text.replace(/\r/g, '').split('\n')
  const out: ReactNode[] = []
  lines.forEach((raw, i) => {
    const line = raw.trimEnd()
    if (line.trim() === '') {
      out.push(<div key={i} className="h-1.5" />)
      return
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const cells = line.split('|').map((s) => s.trim()).filter(Boolean)
      if (cells.length === 0 || cells.every((c) => /^[-:]+$/.test(c))) return
      out.push(
        <div key={i} className="text-[13px] text-gray-dark">
          {renderInline(cells.join(' — '), `t${i}`)}
        </div>,
      )
      return
    }
    const h = line.match(/^#{1,6}\s+(.*)$/)
    if (h) {
      out.push(
        <div key={i} className="mt-1.5 font-semibold text-graphite">
          {renderInline(h[1], `h${i}`)}
        </div>,
      )
      return
    }
    const b = line.match(/^\s*[-*•—]\s+(.*)$/)
    if (b) {
      out.push(
        <div key={i} className="flex gap-2">
          <span className="select-none text-gray-mid">•</span>
          <span className="min-w-0 flex-1">{renderInline(b[1], `b${i}`)}</span>
        </div>,
      )
      return
    }
    const n = line.match(/^\s*(\d+)\.\s+(.*)$/)
    if (n) {
      out.push(
        <div key={i} className="flex gap-2">
          <span className="select-none text-gray-mid tnum">{n[1]}.</span>
          <span className="min-w-0 flex-1">{renderInline(n[2], `n${i}`)}</span>
        </div>,
      )
      return
    }
    out.push(<div key={i}>{renderInline(line, `p${i}`)}</div>)
  })
  return <div className="space-y-0.5">{out}</div>
}

type Props = {
  messages: ChatMessage[]
  onSend: (text: string) => void
  busy: boolean
  suggestions: string[]
  className?: string
}

export function FinancialCoachChat({ messages, onSend, busy, suggestions, className = '' }: Props) {
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const submit = () => {
    const t = input.trim()
    if (!t || busy) return
    onSend(t)
    setInput('')
  }

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((m) =>
          m.role === 'assistant' ? (
            <div key={m.id} className="flex items-start gap-2.5">
              <AlfiAvatar size={26} />
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-bg-light px-3.5 py-2.5 text-[14px] leading-relaxed text-graphite">
                {m.loading ? (
                  <span className="flex gap-1 py-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-mid [animation-delay:-0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-mid [animation-delay:-0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-mid" />
                  </span>
                ) : (
                  renderMarkdown(m.text)
                )}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-end pl-8">
              <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-alfa-red px-3.5 py-2.5 text-[14px] leading-relaxed text-white">
                {m.text}
              </div>
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      <div className="pt-3">
        <div className="no-scrollbar mb-2.5 flex gap-2 overflow-x-auto">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSend(s)}
              disabled={busy}
              className="shrink-0 rounded-full border border-[#ECEDF0] bg-white px-3.5 py-2 text-[13px] font-medium text-graphite shadow-card-sm transition active:scale-[0.97] hover:border-[#dcdee3] disabled:opacity-50 tap-transparent"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Спросить о тратах, доходах или целях…"
            className="flex-1 rounded-full bg-bg-light px-4 py-3 text-[15px] text-graphite outline-none placeholder:text-gray-mid focus:ring-2 focus:ring-alfa-red/25"
          />
          <button
            type="submit"
            aria-label="Отправить"
            disabled={!input.trim() || busy}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-alfa-red text-white transition active:scale-90 disabled:opacity-40 tap-transparent"
          >
            <ArrowUp size={18} strokeWidth={2.4} />
          </button>
        </form>
      </div>
    </div>
  )
}
