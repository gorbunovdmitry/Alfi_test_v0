import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  eyebrow?: string
  children: ReactNode
  footer?: ReactNode
}

export function BottomSheet({ open, onClose, title, eyebrow, children, footer }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-center" role="dialog" aria-modal="true">
      <button
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-graphite/40 backdrop-blur-[2px]"
      />
      <div className="absolute bottom-0 flex w-full max-w-[430px] flex-col">
        <div className="animate-sheet-up flex max-h-[90dvh] flex-col rounded-t-[28px] bg-white shadow-sheet">
          <div className="flex flex-col items-center pt-3">
            <span className="h-1.5 w-10 rounded-full bg-[#E2E4E8]" />
          </div>

          {(title || eyebrow) && (
            <div className="flex items-start justify-between gap-3 px-6 pb-2 pt-4">
              <div className="min-w-0">
                {eyebrow && (
                  <div className="mb-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-mid">
                    {eyebrow}
                  </div>
                )}
                {title && (
                  <h2 className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-graphite">
                    {title}
                  </h2>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Закрыть"
                className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-light text-gray-dark transition active:scale-90 tap-transparent"
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-2">{children}</div>

          {footer && (
            <div className="border-t border-[#F0F1F4] px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
              {footer}
            </div>
          )}
          {!footer && <div className="pb-[max(16px,env(safe-area-inset-bottom))]" />}
        </div>
      </div>
    </div>
  )
}
