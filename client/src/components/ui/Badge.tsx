import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'brand'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-bg-elevated text-text-subtle border-border',
  success: 'bg-success/10 text-success-light border-success/30',
  warning: 'bg-warning/10 text-warning-light border-warning/30',
  danger: 'bg-danger/10 text-danger-light border-danger/30',
  brand: 'bg-brand/10 text-brand-light border-brand/30',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        toneClasses[tone],
        className
      )}
      {...props}
    />
  )
}
