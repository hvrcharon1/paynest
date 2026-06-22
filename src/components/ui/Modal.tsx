import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  widthClass?: string
}

export function Modal({ open, onClose, title, description, children, widthClass = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative w-full bg-bg-surface border border-border rounded-2xl p-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto scrollbar-thin',
          widthClass
        )}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 id="modal-title" className="font-display text-lg font-semibold text-text-primary">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-text-muted hover:text-text-primary transition-colors rounded-lg p-1 -mr-1 -mt-1"
          >
            <X size={18} />
          </button>
        </div>
        {description && <p className="text-sm text-text-muted mb-4">{description}</p>}
        <div className={description ? '' : 'mt-4'}>{children}</div>
      </div>
    </div>
  )
}
