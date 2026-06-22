import { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'neutral' | 'success' | 'warning' | 'danger'
  hint?: string
}

const toneClasses = {
  neutral: 'text-brand-light bg-brand/10',
  success: 'text-success-light bg-success/10',
  warning: 'text-warning-light bg-warning/10',
  danger: 'text-danger-light bg-danger/10',
}

export function StatCard({ label, value, icon: Icon, tone = 'neutral', hint }: StatCardProps) {
  return (
    <Card className="flex items-start gap-4">
      <div className={cn('rounded-xl p-2.5', toneClasses[tone])}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="font-display text-xl font-semibold text-text-primary mt-0.5 tabular truncate">{value}</p>
        {hint && <p className="text-xs text-text-muted mt-1">{hint}</p>}
      </div>
    </Card>
  )
}
