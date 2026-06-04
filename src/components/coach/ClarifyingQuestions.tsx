import { useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import type { ClarifyingQuestion } from '../../types/coach'
import { ProgressBar } from './ProgressBar'

type Props = {
  questions: ClarifyingQuestion[]
  answers: Record<string, string>
  onAnswer: (id: string, value: string) => void
  onComplete: () => void
}

export function ClarifyingQuestions({ questions, answers, onAnswer, onComplete }: Props) {
  const [index, setIndex] = useState(0)
  const q = questions[index]
  const selected = answers[q.id]

  const choose = (value: string) => {
    onAnswer(q.id, value)
    if (index + 1 < questions.length) setIndex(index + 1)
    else onComplete()
  }

  return (
    <div className="rounded-[26px] bg-white p-6 shadow-card sm:p-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-light text-gray-dark transition active:scale-90 disabled:opacity-0 tap-transparent"
          aria-label="Назад"
        >
          <ArrowLeft size={16} strokeWidth={2.2} />
        </button>
        <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-gray-mid">
          Вопрос {index + 1} из {questions.length}
        </span>
        <span className="w-8" />
      </div>

      <div className="mt-3">
        <ProgressBar fraction={(index + 1) / questions.length} color="#EF3124" height={6} />
      </div>

      <h2 className="mt-6 text-[20px] font-bold leading-snug tracking-[-0.01em] text-graphite">
        {q.question}
      </h2>
      {q.hint && <p className="mt-2 text-[13.5px] leading-relaxed text-gray-mid">{q.hint}</p>}

      <div className="mt-5 space-y-2.5">
        {q.options.map((o) => {
          const isSel = selected === o.value
          return (
            <button
              key={o.value}
              onClick={() => choose(o.value)}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] font-medium transition active:scale-[0.99] tap-transparent ${
                isSel
                  ? 'border-alfa-red bg-alfa-red/[0.06] text-graphite'
                  : 'border-[#ECEDF0] bg-white text-gray-dark hover:border-[#dcdee3]'
              }`}
            >
              {o.label}
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                  isSel ? 'border-alfa-red bg-alfa-red text-white' : 'border-[#D4D7DD]'
                }`}
              >
                {isSel && <Check size={12} strokeWidth={3} />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
