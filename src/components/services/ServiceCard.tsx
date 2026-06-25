import * as Icons from 'lucide-react'
import { Pause, Play, Trash2, CheckCircle2, ExternalLink } from 'lucide-react'
import type { ExternalService, OAuthConnection, PaymentMethod } from '@/types'
import { CATEGORY_META } from '@/lib/categories'
import { Badge } from '@/components/ui/Badge'
import { Switch } from '@/components/ui/Switch'
import { Button } from '@/components/ui/Button'
import { IntegrationBadge } from '@/components/services/IntegrationBadge'
import { cn, formatCurrency, daysUntil } from '@/lib/utils'
import { formatDate } from '@/lib/format'

interface ServiceCardProps {
  service: ExternalService
  paymentMethod: PaymentMethod | undefined
  oauthConnection?: OAuthConnection
  onToggleAutopay: (id: string) => void
  onPauseToggle: (id: string) => void
  onRemove: (id: string) => void
  onMarkPaid: (id: string) => void
}

export function ServiceCard({
  service,
  paymentMethod,
  oauthConnection,
  onToggleAutopay,
  onPauseToggle,
  onRemove,
  onMarkPaid,
}: ServiceCardProps) {
  const meta  = CATEGORY_META[service.category]
  const Icon  = (Icons as unknown as Record<string, Icons.LucideIcon>)[meta.icon] ?? Icons.CircleDollarSign
  const d     = daysUntil(service.nextDueDate)
  const isPaused = service.status === 'paused'

  // Credit card utilization
  const isCreditCard = service.category === 'credit_card'
  const utilPct =
    isCreditCard && service.creditLimit != null && service.statementBalance != null
      ? Math.min(100, (service.statementBalance / service.creditLimit) * 100)
      : null
  const utilBarColor  = utilPct === null ? '' : utilPct < 30 ? 'bg-success'   : utilPct < 60 ? 'bg-warning'   : 'bg-danger'
  const utilTextColor = utilPct === null ? '' : utilPct < 30 ? 'text-success' : utilPct < 60 ? 'text-warning' : 'text-danger'

  const paymentTypeLabel =
    service.cardPaymentType === 'minimum'   ? 'Paying minimum'
    : service.cardPaymentType === 'statement' ? 'Paying full balance'
    : service.cardPaymentType === 'custom'    ? 'Custom amount'
    : null

  return (
    <div className="bg-bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="rounded-xl p-2.5 shrink-0"
            style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
          >
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-text-primary truncate">{service.providerName}</p>
            <p className="text-xs text-text-muted truncate">
              {meta.label} · {service.accountRef}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {service.status === 'overdue' && <Badge tone="danger">Overdue</Badge>}
          {isPaused && <Badge tone="neutral">Paused</Badge>}
          <IntegrationBadge
            tier={service.integrationTier}
            oauthConnection={oauthConnection}
            compact
          />
        </div>
      </div>

      {/* Data grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-text-muted text-xs">{isCreditCard ? 'Payment' : 'Amount'}</p>
          <p className="text-text-primary font-semibold tabular">{formatCurrency(service.amount)}</p>
        </div>
        <div>
          <p className="text-text-muted text-xs">Frequency</p>
          <p className="text-text-primary capitalize">{service.frequency.replace('_', ' ')}</p>
        </div>
        <div>
          <p className="text-text-muted text-xs">Next due</p>
          <p className="text-text-primary">
            {formatDate(service.nextDueDate)}{' '}
            {!isPaused && <span className="text-text-muted">({d}d)</span>}
          </p>
        </div>
        <div>
          <p className="text-text-muted text-xs">Funded by</p>
          <p className="text-text-primary truncate">{paymentMethod ? paymentMethod.label : 'Not set'}</p>
        </div>
      </div>

      {/* ── Credit card details block ── */}
      {isCreditCard && (
        <div className={cn('space-y-3 pt-3 border-t border-border')}>

          {/* Utilization bar */}
          {utilPct !== null && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-muted">Credit utilization</span>
                <span className={utilTextColor}>{utilPct.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${utilBarColor}`}
                  style={{ width: `${utilPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-muted">
                <span>{formatCurrency(service.statementBalance!)} owed</span>
                <span>{formatCurrency(service.creditLimit!)} limit</span>
              </div>
            </div>
          )}

          {/* Min. payment + APR row */}
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              {service.minimumPayment != null && (
                <p className="text-xs text-text-muted">
                  Min. due:{' '}
                  <span className="text-text-subtle font-medium">
                    {formatCurrency(service.minimumPayment)}
                  </span>
                </p>
              )}
              {paymentTypeLabel && (
                <p className="text-xs text-text-muted">{paymentTypeLabel}</p>
              )}
            </div>
            {service.apr != null && (
              <span className="shrink-0 text-xs bg-bg-elevated border border-border rounded-full px-2 py-0.5 text-text-muted">
                {service.apr}% APR
              </span>
            )}
          </div>
        </div>
      )}

      {service.notes && <p className="text-xs text-text-muted italic">{service.notes}</p>}

      {/* Portal quick-link */}
      {service.integrationTier === 'portal' && service.portalUrl && (
        <a
          href={service.portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-brand hover:text-brand-light transition-colors"
        >
          <ExternalLink size={13} /> Visit portal
        </a>
      )}

      {/* Actions row */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <Switch
            checked={service.autopayEnabled}
            onChange={() => onToggleAutopay(service.id)}
            label="Toggle autopay"
            disabled={isPaused}
          />
          <span className="text-xs text-text-muted">
            {service.autopayEnabled ? 'Autopay on' : 'Autopay off'}
          </span>
        </div>
        <div className="flex gap-2">
          {!service.autopayEnabled && !isPaused && (
            <Button size="sm" variant="secondary" onClick={() => onMarkPaid(service.id)}>
              <CheckCircle2 size={14} /> Mark paid
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onPauseToggle(service.id)}
            aria-label={isPaused ? 'Resume service' : 'Pause service'}
          >
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => onRemove(service.id)}
            aria-label="Remove service"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
