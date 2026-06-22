import { Lightbulb, AlertTriangle, OctagonAlert } from 'lucide-react'
import type { AIInsight } from '@/types'
import { cn } from '@/lib/utils'

const severityConfig = {
  info: { icon: Lightbulb, classes: 'border-brand/25 bg-brand/5 text-brand-light' },
  warning: { icon: AlertTriangle, classes: 'border-warning/25 bg-warning/5 text-warning-light' },
  critical: { icon: OctagonAlert, classes: 'border-danger/25 bg-danger/5 text-danger-light' },
}

export function InsightCard({ insight }: { insight: AIInsight }) {
  const { icon: Icon, classes } = severityConfig[insight.severity]

  return (
    <div className={cn('rounded-xl border p-4 flex gap-3', classes)}>
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-text-primary">{insight.title}</p>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">{insight.detail}</p>
      </div>
    </div>
  )
}
