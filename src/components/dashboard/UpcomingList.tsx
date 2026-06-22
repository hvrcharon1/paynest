import { CalendarClock, CheckCircle2, AlertTriangle } from 'lucide-react'
import * as Icons from 'lucide-react'
import type { ExternalService } from '@/types'
import { CATEGORY_META } from '@/lib/categories'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, daysUntil } from '@/lib/utils'
import { formatDateShort } from '@/lib/format'
import { useAppStore } from '@/store/useStore'

interface UpcomingListProps {
  services: ExternalService[]
  limit?: number
}

export function UpcomingList({ services, limit }: UpcomingListProps) {
  const markPaid = useAppStore((s) => s.markPaid)

  const sorted = [...services]
    .filter((s) => s.status !== 'paused')
    .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime())
    .slice(0, limit)

  if (sorted.length === 0) {
    return (
      <div className="text-center py-10 text-text-muted text-sm">
        <CalendarClock className="mx-auto mb-2 opacity-50" size={28} />
        No upcoming payments. Add a service to get started.
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {sorted.map((s) => {
        const meta = CATEGORY_META[s.category]
        const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[meta.icon] ?? Icons.CircleDollarSign
        const d = daysUntil(s.nextDueDate)
        const overdue = d < 0

        return (
          <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <div className="rounded-xl p-2 shrink-0" style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}>
              <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary truncate">{s.providerName}</p>
              <p className="text-xs text-text-muted">
                {formatDateShort(s.nextDueDate)} · {meta.label}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-text-primary tabular">{formatCurrency(s.amount)}</p>
              {overdue ? (
                <Badge tone="danger" className="mt-1">
                  <AlertTriangle size={11} /> Overdue
                </Badge>
              ) : s.autopayEnabled ? (
                <Badge tone="success" className="mt-1">
                  <CheckCircle2 size={11} /> Autopay · {d}d
                </Badge>
              ) : (
                <Badge tone="warning" className="mt-1">
                  Manual · {d}d
                </Badge>
              )}
            </div>
            {!s.autopayEnabled && (
              <Button size="sm" variant="secondary" onClick={() => markPaid(s.id)} className="shrink-0">
                Mark paid
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
