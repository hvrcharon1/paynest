import * as Icons from 'lucide-react'
import { Pause, Play, Trash2, CheckCircle2, ExternalLink } from 'lucide-react'
import type { ExternalService, OAuthConnection, PaymentMethod } from '@/types'
import { CATEGORY_META } from '@/lib/categories'
import { Badge } from '@/components/ui/Badge'
import { Switch } from '@/components/ui/Switch'
import { Button } from '@/components/ui/Button'
import { IntegrationBadge } from '@/components/services/IntegrationBadge'
import { formatCurrency, daysUntil } from '@/lib/utils'
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
  const meta = CATEGORY_META[service.category]
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[meta.icon] ?? Icons.CircleDollarSign
  const d = daysUntil(service.nextDueDate)
  const isPaused = service.status === 'paused'

  return (
    <div className="bg-bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="rounded-xl p-2.5 shrink-0" style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}>
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
          <p className="text-text-muted text-xs">Amount</p>
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
          <span className="text-xs text-text-muted">{service.autopayEnabled ? 'Autopay on' : 'Autopay off'}</span>
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
