import { CreditCard, Landmark, Wallet, Star, Trash2 } from 'lucide-react'
import type { PaymentMethod } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

const typeIcon = { card: CreditCard, bank_account: Landmark, wallet: Wallet }
const typeLabel = { card: 'Card', bank_account: 'Bank account', wallet: 'Wallet' }

interface PaymentMethodCardProps {
  method: PaymentMethod
  onSetDefault: (id: string) => void
  onRemove: (id: string) => void
  linkedCount: number
}

export function PaymentMethodCard({ method, onSetDefault, onRemove, linkedCount }: PaymentMethodCardProps) {
  const Icon = typeIcon[method.type]

  return (
    <div className="bg-bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2.5 bg-brand/10 text-brand-light">
            <Icon size={20} />
          </div>
          <div>
            <p className="font-medium text-text-primary">{method.label}</p>
            <p className="text-xs text-text-muted">
              {typeLabel[method.type]} · •••• {method.identifier}
              {method.expiry ? ` · exp ${method.expiry}` : ''}
            </p>
          </div>
        </div>
        {method.isDefault && (
          <Badge tone="brand">
            <Star size={11} /> Default
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>{linkedCount} linked service{linkedCount === 1 ? '' : 's'}</span>
        <div className="flex gap-2">
          {!method.isDefault && (
            <Button size="sm" variant="secondary" onClick={() => onSetDefault(method.id)}>
              Set default
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={() => onRemove(method.id)} aria-label="Remove payment method">
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
