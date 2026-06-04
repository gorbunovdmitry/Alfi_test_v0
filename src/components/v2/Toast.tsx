import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type ToastFn = (message: string) => void
const ToastContext = createContext<ToastFn>(() => {})

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  const toast = useCallback((m: string) => {
    setMsg(m)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMsg(null), 2800)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {msg && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
          <div className="pointer-events-auto max-w-md animate-pop-in rounded-2xl bg-graphite px-4 py-3 text-center text-[14px] font-medium text-white shadow-sheet">
            {msg}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}
