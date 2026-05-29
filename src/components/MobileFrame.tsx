import type { ReactNode } from 'react'

export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] w-full justify-center">
      <div className="relative flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-white">
        {children}
      </div>
    </div>
  )
}
