import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowUp } from 'lucide-react'
import type { Transaction, WeekState } from '../../types'
import { formatRub } from '../../lib/format'
import { ALFI_MODEL, ALFI_SYSTEM_PROMPT } from '../../lib/alfiSystemPrompt'
import { buildUserContext } from '../../lib/userContext'
import { CHAT_SUGGESTIONS } from '../../lib/chatSuggestions'
import { BottomSheet } from '../ui/BottomSheet'
import { Chip } from '../ui/Chip'
import { AlfiAvatar } from '../AlfiAvatar'

type Message = { id: number; role: 'assistant' | 'user'; text: string; loading?: boolean }

const GREETING =
  'Здравствуйте. Помогу разобраться с «Финансовой неделей»: подскажу, как закрыть кольца, на что обратить внимание и как пользоваться функциями Альфа-Банка. Не вводите в чат персональные данные.'

const QUICK_FOLLOWUPS = [
  { label: 'План на неделю', prompt: 'Составь короткий план на эту неделю, чтобы закрыть кольца.' },
  { label: 'Где сократить', prompt: 'Где мне сократить траты на этой неделе?' },
]

/** Offline fallback when the API key isn't set or the request fails. */
function scriptedFallback(prompt: string, ws: WeekState): string {
  const q = prompt.toLowerCase()
  const rem = formatRub(Math.max(0, ws.spendingRemaining))
  if (q.includes('закрыть недел'))
    return `Сейчас неделя на ${ws.weekControlPercent}% под контролем. Чтобы закрыть кольца:\n1. Удержать необязательные траты в пределах ${rem} до воскресенья.\n2. Увеличить сбережения ещё на ${formatRub(ws.savingsRemaining)}.\n3. Внести ${formatRub(ws.goalRemainingStep)} в цель «${ws.goal.name}».`
  if (q.includes('категори') || q.includes('просел') || q.includes('почему')) {
    const top = ws.spendingByCategory[0]
    return top
      ? `Больше всего в этой неделе — ${top.label}: ${formatRub(top.amount)}. Всего по управляемым тратам ${formatRub(ws.actualSpending)} из ${formatRub(ws.spendingTarget)}.`
      : 'Разбивку трат по категориям можно посмотреть на кольце «Управление тратами».'
  }
  if (q.includes('сегодня') || q.includes('потрат'))
    return `Сегодня без риска для недели можно потратить ${formatRub(ws.safeToSpendToday)} — это остаток лимита (${rem}), делённый на ${ws.daysLeft} дн. до конца недели.`
  if (q.includes('цель') || q.includes('автоперевод') || q.includes('пересчит'))
    return `Цель «${ws.goal.name}»: внесено ${formatRub(ws.goalContributions)} из ${formatRub(ws.goalStep)} за неделю. Автоперевод в цель настраивается в разделе «Цели» → выбрать цель → «Автопополнение».`
  return GREETING
}

/** Inline **bold** parsing. */
function renderInline(text: string, keyBase: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((seg, j) =>
    j % 2 === 1 ? <strong key={`${keyBase}-${j}`}>{seg}</strong> : <span key={`${keyBase}-${j}`}>{seg}</span>,
  )
}

/** Lightweight Markdown renderer: headings, bullets, numbered lists, tables (degraded), bold. */
function renderMarkdown(text: string): ReactNode {
  const lines = text.replace(/\r/g, '').split('\n')
  const out: ReactNode[] = []

  lines.forEach((raw, i) => {
    const line = raw.trimEnd()
    if (line.trim() === '') {
      out.push(<div key={i} className="h-1.5" />)
      return
    }
    // Table row → degrade to a plain line ("cell — cell"); skip separator rows.
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
    // Heading → bold label.
    const h = line.match(/^#{1,6}\s+(.*)$/)
    if (h) {
      out.push(
        <div key={i} className="mt-1.5 font-semibold text-graphite">
          {renderInline(h[1], `h${i}`)}
        </div>,
      )
      return
    }
    // Bullet.
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
    // Numbered.
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

export function ChatBottomSheet({
  open,
  onClose,
  ws,
  transactions,
  initialPrompt,
  onOpenGoal,
}: {
  open: boolean
  onClose: () => void
  ws: WeekState
  transactions: Transaction[]
  initialPrompt?: string
  onOpenGoal?: () => void
}) {
  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: 'assistant', text: GREETING }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const idRef = useRef(1)
  const endRef = useRef<HTMLDivElement>(null)
  const initRef = useRef(false)
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  const send = async (raw: string) => {
    const text = raw.trim()
    if (!text || busy) return

    const priorTurns = messagesRef.current
      .filter((m) => m.id !== 0 && !m.loading && m.text)
      .map((m) => ({ role: m.role, content: m.text }))

    const userMsg: Message = { id: idRef.current++, role: 'user', text }
    const loadingMsg: Message = { id: idRef.current++, role: 'assistant', text: '', loading: true }
    setMessages((m) => [...m, userMsg, loadingMsg])
    setInput('')
    setBusy(true)

    const apiMessages = [
      { role: 'system', content: ALFI_SYSTEM_PROMPT },
      { role: 'system', content: buildUserContext(ws, transactions) },
      ...priorTurns,
      { role: 'user', content: text },
    ]

    let answer = ''
    try {
      const resp = await fetch(`${import.meta.env.VITE_CHAT_API_BASE ?? ''}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ALFI_MODEL,
          messages: apiMessages,
          reasoning_effort: 'low',
          max_completion_tokens: 1000,
        }),
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const data = await resp.json()
      answer = (data?.choices?.[0]?.message?.content ?? '').trim()
      if (!answer) throw new Error('EMPTY')
    } catch {
      answer = scriptedFallback(text, ws)
    }

    setMessages((m) => m.map((x) => (x.id === loadingMsg.id ? { ...x, text: answer, loading: false } : x)))
    setBusy(false)
  }

  useEffect(() => {
    if (open && initialPrompt && !initRef.current) {
      initRef.current = true
      void send(initialPrompt)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialPrompt])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const footer = (
    <div>
      <div className="no-scrollbar -mx-6 mb-3 flex gap-2 overflow-x-auto px-6">
        {CHAT_SUGGESTIONS.map((s) => (
          <Chip key={s} onClick={() => send(s)} disabled={busy}>
            {s}
          </Chip>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Спросить Альфи…"
          className="flex-1 rounded-full bg-bg-light px-4 py-3 text-[15px] text-graphite outline-none placeholder:text-gray-mid focus:ring-2 focus:ring-alfa-red/25"
        />
        <button
          type="submit"
          aria-label="Отправить"
          disabled={!input.trim() || busy}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-alfa-red text-white transition active:scale-90 disabled:opacity-40"
        >
          <ArrowUp size={18} strokeWidth={2.4} />
        </button>
      </form>
    </div>
  )

  return (
    <BottomSheet open={open} onClose={onClose} title="Альфи" eyebrow="AI-помощник" footer={footer}>
      <div className="flex min-h-[42dvh] flex-col gap-3 py-1">
        {messages.map((m) =>
          m.role === 'assistant' ? (
            <div key={m.id} className="flex items-start gap-2.5 pr-6">
              <AlfiAvatar size={28} />
              <div className="min-w-0 flex-1">
                <div className="rounded-2xl rounded-tl-md bg-bg-light px-3.5 py-2.5 text-[14px] leading-relaxed text-graphite">
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
                {!m.loading && m.id === messages[messages.length - 1].id && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {QUICK_FOLLOWUPS.map((q) => (
                      <Chip key={q.label} onClick={() => send(q.prompt)} disabled={busy}>
                        {q.label}
                      </Chip>
                    ))}
                    {onOpenGoal && <Chip onClick={onOpenGoal}>Открыть цель</Chip>}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-end pl-10">
              <div className="rounded-2xl rounded-tr-md bg-alfa-red px-3.5 py-2.5 text-[14px] leading-relaxed text-white">
                {m.text}
              </div>
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>
    </BottomSheet>
  )
}
