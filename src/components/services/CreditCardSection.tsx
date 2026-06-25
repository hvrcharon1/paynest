import { CreditCard, Info } from 'lucide-react'
import { FieldWrap, Input } from '@/components/ui/Field'
import type { CreditCardPaymentType } from '@/types'
import { cn, formatCurrency } from '@/lib/utils'

interface CreditCardSectionProps {
  creditLimit: string
  statementBalance: string
  minimumPayment: string
  apr: string
  cardPaymentType: CreditCardPaymentType
  onCreditLimitChange: (v: string) => void
  onStatementBalanceChange: (v: string) => void
  onMinimumPaymentChange: (v: string) => void
  onAprChange: (v: string) => void
  onCardPaymentTypeChange: (t: CreditCardPaymentType) => void
  /** Syncs the parent form's amount field whenever the effective payment amount changes. */
  onAmountChange: (v: string) => void
}

const PAYMENT_TYPES: { value: CreditCardPaymentType; label: string; desc: string }[] = [
  { value: 'minimum',   label: 'Minimum due',   desc: 'Pay the minimum' },
  { value: 'statement', label: 'Full balance',  desc: 'Pay statement total' },
  { value: 'custom',    label: 'Custom',         desc: 'Enter own amount' },
]

export function CreditCardSection({
  creditLimit,
  statementBalance,
  minimumPayment,
  apr,
  cardPaymentType,
  onCreditLimitChange,
  onStatementBalanceChange,
  onMinimumPaymentChange,
  onAprChange,
  onCardPaymentTypeChange,
  onAmountChange,
}: CreditCardSectionProps) {
  const limit   = parseFloat(creditLimit)      || 0
  const balance = parseFloat(statementBalance) || 0
  const utilPct = limit > 0 ? Math.min(100, (balance / limit) * 100) : 0

  const barColor  = utilPct < 30 ? 'bg-success'    : utilPct < 60 ? 'bg-warning'    : 'bg-danger'
  const textColor = utilPct < 30 ? 'text-success'  : utilPct < 60 ? 'text-warning'  : 'text-danger'

  function handlePaymentTypeChange(type: CreditCardPaymentType) {
    onCardPaymentTypeChange(type)
    if (type === 'minimum')   onAmountChange(minimumPayment)
    if (type === 'statement') onAmountChange(statementBalance)
    // 'custom' — parent amount field becomes editable; leave it as-is
  }

  function handleMinimumPaymentChange(v: string) {
    onMinimumPaymentChange(v)
    if (cardPaymentType === 'minimum') onAmountChange(v)
  }

  function handleStatementBalanceChange(v: string) {
    onStatementBalanceChange(v)
    if (cardPaymentType === 'statement') onAmountChange(v)
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-bg-elevated p-4">
      {/* Section header */}
      <div className="flex items-center gap-2 text-xs text-text-muted uppercase tracking-wide font-medium">
        <CreditCard size={13} />
        Card details
      </div>

      {/* Limit + APR */}
      <div className="grid grid-cols-2 gap-4">
        <FieldWrap label="Credit limit" hint="Total credit line">
          <Input
            type="number"
            min="0"
            step="100"
            value={creditLimit}
            onChange={(e) => onCreditLimitChange(e.target.value)}
            placeholder="5000"
          />
        </FieldWrap>
        <FieldWrap label="APR (%)" hint="Annual interest rate">
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={apr}
            onChange={(e) => onAprChange(e.target.value)}
            placeholder="24.99"
          />
        </FieldWrap>
      </div>

      {/* Statement balance + Minimum payment */}
      <div className="grid grid-cols-2 gap-4">
        <FieldWrap label="Statement balance" hint="Current amount owed">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={statementBalance}
            onChange={(e) => handleStatementBalanceChange(e.target.value)}
            placeholder="1200.00"
          />
        </FieldWrap>
        <FieldWrap label="Minimum payment" hint="Required this cycle">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={minimumPayment}
            onChange={(e) => handleMinimumPaymentChange(e.target.value)}
            placeholder="35.00"
          />
        </FieldWrap>
      </div>

      {/* Live utilization bar */}
      {limit > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Utilization</span>
            <span className={textColor}>{utilPct.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-bg-base rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${utilPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <span>{formatCurrency(balance)} owed</span>
            <span>{formatCurrency(limit)} limit</span>
          </div>
        </div>
      )}

      {/* Payment type selector */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-text-primary">I want to pay</p>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_TYPES.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => handlePaymentTypeChange(value)}
              className={cn(
                'flex flex-col gap-1 p-2.5 rounded-xl border text-left transition-all',
                cardPaymentType === value
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border bg-bg-base text-text-muted hover:border-brand/40',
              )}
            >
              <span className="text-xs font-semibold">{label}</span>
              <span className="text-xs opacity-60">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hint when amount is auto-filled */}
      {cardPaymentType !== 'custom' && (
        <div className="flex items-start gap-2 text-xs text-text-muted">
          <Info size={12} className="shrink-0 mt-0.5" />
          <span>
            The{' '}
            <strong className="text-text-subtle">Payment amount</strong>{' '}
            below is auto-filled from your{' '}
            {cardPaymentType === 'minimum' ? 'minimum payment' : 'statement balance'}.
            Switch to Custom to enter a different figure.
          </span>
        </div>
      )}
    </div>
  )
}
