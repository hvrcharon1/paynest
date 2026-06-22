import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface FieldWrapProps {
  label?: string
  hint?: string
  error?: string
  children: ReactNode
}

export function FieldWrap({ label, hint, error, children }: FieldWrapProps) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-text-primary mb-1.5">{label}</span>}
      {children}
      {hint && !error && <span className="block text-xs text-text-muted mt-1">{hint}</span>}
      {error && <span className="block text-xs text-danger-light mt-1">{error}</span>}
    </label>
  )
}

const baseFieldClasses =
  'w-full bg-bg-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(baseFieldClasses, className)} {...props} />
  )
)
Input.displayName = 'Input'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(baseFieldClasses, 'appearance-none', className)} {...props}>
      {children}
    </select>
  )
)
Select.displayName = 'Select'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(baseFieldClasses, 'resize-none', className)} {...props} />
  )
)
Textarea.displayName = 'Textarea'
