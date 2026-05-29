import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark'
type Size = 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-medium tracking-[-0.01em] transition active:scale-[0.985] tap-transparent disabled:opacity-40 disabled:active:scale-100'

const variants: Record<Variant, string> = {
  primary: 'bg-alfa-red text-white shadow-[0_8px_22px_rgba(239,49,36,0.28)] hover:bg-[#e0271b]',
  dark: 'bg-graphite text-white hover:bg-black',
  secondary: 'bg-bg-light text-graphite hover:bg-[#eceef1]',
  ghost: 'bg-transparent text-gray-dark hover:bg-bg-light',
}

const sizes: Record<Size, string> = {
  md: 'h-11 px-4 text-[15px]',
  lg: 'h-[52px] px-5 text-[16px]',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  leftIcon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  leftIcon,
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {leftIcon}
      {children}
    </button>
  )
}
