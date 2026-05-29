import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  leftIcon?: ReactNode
}

export function Chip({ leftIcon, className = '', children, ...rest }: Props) {
  return (
    <button
      className={`inline-flex shrink-0 items-center gap-2 rounded-full border border-[#ECEDF0] bg-white px-4 py-2.5 text-[14px] font-medium text-graphite shadow-card-sm transition active:scale-[0.97] hover:border-[#dcdee3] tap-transparent ${className}`}
      {...rest}
    >
      {leftIcon}
      {children}
    </button>
  )
}
