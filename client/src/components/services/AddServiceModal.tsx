import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, Link2, Wifi, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { FieldWrap, Input, Select, Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { useAppStore } from '@/store/useStore'
import { CATEGORY_LIST } from '@/lib/categories'
import { clampDueDay, cn } from '@/lib/utils'
import { PortalCredentialsSection } from '@/components/services/PortalCredentialsSection'
import { OAuthConnectFlow } from '@/components/services/OAuthConnectFlow'
import { CreditCardSection } from '@/components/services/CreditCardSection'
import type { CreditCardPaymentType, Frequency, IntegrationTier, ServiceCategory } from '@/types'

interface AddServiceModalProps {
  open: boolean
  onClose: () => void
}

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'weekly',    label: 'Weekly' },
  { value: 'biweekly',  label: 'Every 2 weeks' },
  { value: 'monthly',   label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually',  label: 'Annually' },
  { value: 'one_time',  label: 'One time' },
]

const STEPS = [
  { key: 'details'     as const, label: 'Details' },
  { key: 'integration' as const, label: 'Integration' },
]

export function AddServiceModal({ open, onClose }: AddServiceModalProps) {
  const paymentMethods = useAppStore((s) => s.paymentMethods)
  const addService     = useAppStore((s) => s.addService)

  // Step tracker
  const [step, setStep] = useState<'details' | 'integration'>('details')
  const currentStepIdx  = STEPS.findIndex((s) => s.key === step)

  // ── Step 1: Details ──────────────────────────────────────────────────────
  const [category,         setCategory]         = useState<ServiceCategory>('rent')
  const [providerName,     setProviderName]     = useState('')
  const [accountRef,       setAccountRef]       = useState('')
  const [paymentMethodId,  setPaymentMethodId]  = useState(paymentMethods[0]?.id ?? '')
  const [amount,           setAmount]           = useState('')
  const [frequency,        setFrequency]        = useState<Frequency>('monthly')
  const [dueDay,           setDueDay]           = useState('1')
  const [autopayEnabled,   setAutopayEnabled]   = useState(true)
  const [notifyDaysBefore, setNotifyDaysBefore] = useState('3')
  const [notes,            setNotes]            = useState('')

  // ── Credit card specific ──────────────────────────────────────────────────
  const [creditLimit,      setCreditLimit]      = useState('')
  const [statementBalance, setStatementBalance] = useState('')
  const [minimumPayment,   setMinimumPayment]   = useState('')
  const [apr,              setApr]              = useState('')
  const [cardPaymentType,  setCardPaymentType]  = useState<CreditCardPaymentType>('minimum')

  // ── Step 2: Integration ───────────────────────────────────────────────────
  const [integrationTier,   setIntegrationTier]   = useState<IntegrationTier>('none')
  const [portalUrl,         setPortalUrl]         = useState('')
  const [loginId,           setLoginId]           = useState('')
  const [loginPassword,     setLoginPassword]     = useState('')
  const [oauthConnectionId, setOauthConnectionId] = useState<string | undefined>()

  // ── Helpers ───────────────────────────────────────────────────────────────

  function handleCategoryChange(next: ServiceCategory) {
    setCategory(next)
    // Clear credit card fields when switching away
    if (next !== 'credit_card') {
      setCreditLimit('')
      setStatementBalance('')
      setMinimumPayment('')
      setApr('')
      setCardPaymentType('minimum')
      setAmount('')   // let user re-enter for non-CC categories
    }
  }

  function resetAll() {
    setStep('details')
    setCategory('rent')
    setProviderName('')
    setAccountRef('')
    setPaymentMethodId(paymentMethods[0]?.id ?? '')
    setAmount('')
    setFrequency('monthly')
    setDueDay('1')
    setAutopayEnabled(true)
    setNotifyDaysBefore('3')
    setNotes('')
    setCreditLimit('')
    setStatementBalance('')
    setMinimumPayment('')
    setApr('')
    setCardPaymentType('minimum')
    setIntegrationTier('none')
    setPortalUrl('')
    setLoginId('')
    setLoginPassword('')
    setOauthConnectionId(undefined)
  }

  function handleDetailsSubmit(e: FormEvent) {
    e.preventDefault()
    if (!providerName.trim() || !paymentMethodId) return
    // For credit cards, amount is set via CreditCardSection; for others it must be provided
    if (category !== 'credit_card' && !amount) return
    setStep('integration')
  }

  function handleFinalSubmit() {
    const isCreditCard = category === 'credit_card'
    addService({
      category,
      providerName:     providerName.trim(),
      accountRef:       accountRef.trim(),
      paymentMethodId,
      amount:           parseFloat(amount) || 0,
      frequency,
      dueDay:           clampDueDay(parseInt(dueDay, 10) || 1),
      autopayEnabled,
      notifyDaysBefore: parseInt(notifyDaysBefore, 10) || 3,
      notes:            notes.trim() || undefined,
      integrationTier,
      portalUrl:        portalUrl.trim()  || undefined,
      loginId:          loginId.trim()    || undefined,
      loginPassword:    loginPassword     || undefined,
      oauthConnectionId,
      // Credit card fields — only set when applicable
      creditLimit:      isCreditCard && creditLimit      ? parseFloat(creditLimit)      : undefined,
      statementBalance: isCreditCard && statementBalance ? parseFloat(statementBalance) : undefined,
      minimumPayment:   isCreditCard && minimumPayment   ? parseFloat(minimumPayment)   : undefined,
      apr:              isCreditCard && apr               ? parseFloat(apr)               : undefined,
      cardPaymentType:  isCreditCard                     ? cardPaymentType               : undefined,
    })
    resetAll()
    onClose()
  }

  const isCreditCard     = category === 'credit_card'
  const amountAutoFilled = isCreditCard && cardPaymentType !== 'custom'
  const noPaymentMethods = paymentMethods.length === 0

  return (
    <Modal
      open={open}
      onClose={() => { resetAll(); onClose() }}
      title={step === 'details' ? 'Connect a service' : 'Integration (optional)'}
      description={
        step === 'details'
          ? 'Link any recurring or one-time bill — loans, rent, utilities, insurance, citations, school fees, credit cards, or paying back a friend.'
          : 'Optionally connect a provider portal or link via OAuth 2.0 for richer integration.'
      }
      widthClass="max-w-lg"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-5 -mt-1">
        {STEPS.map(({ key, label }, i) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold',
                i === currentStepIdx
                  ? 'bg-brand text-white'
                  : i < currentStepIdx
                    ? 'bg-success text-white'
                    : 'bg-bg-elevated text-text-muted border border-border',
              )}
            >
              {i + 1}
            </div>
            <span className={cn('text-xs', i === currentStepIdx ? 'text-text-primary font-medium' : 'text-text-muted')}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      {noPaymentMethods ? (
        <p className="text-sm text-text-muted">
          Add a payment method first, then come back to connect a service.
        </p>
      ) : step === 'details' ? (
        <form onSubmit={handleDetailsSubmit} className="space-y-4">

          <FieldWrap label="Category">
            <Select value={category} onChange={(e) => handleCategoryChange(e.target.value as ServiceCategory)}>
              {CATEGORY_LIST.map(([value, meta]) => (
                <option key={value} value={value}>{meta.label}</option>
              ))}
            </Select>
          </FieldWrap>

          <FieldWrap
            label="Provider name"
            hint={isCreditCard ? "e.g. 'Chase Sapphire Reserve' or 'Citi Double Cash'" : "e.g. 'Riverside Apartments' or 'Chase Auto Loan'"}
          >
            <Input
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder={isCreditCard ? 'Chase Sapphire Reserve' : 'Riverside Apartments'}
              required
            />
          </FieldWrap>

          <FieldWrap
            label="Account reference"
            hint={isCreditCard ? 'Last 4 digits or account alias' : 'Account number, unit, policy, or citation #'}
          >
            <Input
              value={accountRef}
              onChange={(e) => setAccountRef(e.target.value)}
              placeholder={isCreditCard ? 'Last 4: 4521' : 'Unit 14B'}
            />
          </FieldWrap>

          <FieldWrap label="Pay with">
            <Select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>{pm.label} (•••• {pm.identifier})</option>
              ))}
            </Select>
          </FieldWrap>

          {/* Credit card details section */}
          {isCreditCard && (
            <CreditCardSection
              creditLimit={creditLimit}
              statementBalance={statementBalance}
              minimumPayment={minimumPayment}
              apr={apr}
              cardPaymentType={cardPaymentType}
              onCreditLimitChange={setCreditLimit}
              onStatementBalanceChange={setStatementBalance}
              onMinimumPaymentChange={setMinimumPayment}
              onAprChange={setApr}
              onCardPaymentTypeChange={setCardPaymentType}
              onAmountChange={setAmount}
            />
          )}

          {/* Amount + Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <FieldWrap
              label={isCreditCard ? 'Payment amount (USD)' : 'Amount (USD)'}
              hint={amountAutoFilled ? 'Auto-filled — change payment type to Custom to edit' : undefined}
            >
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={isCreditCard ? '0.00' : '1850.00'}
                disabled={amountAutoFilled}
                required={!isCreditCard}
              />
            </FieldWrap>
            <FieldWrap label="Frequency">
              <Select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
            </FieldWrap>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FieldWrap label="Due day of month" hint="1-31">
              <Input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} required />
            </FieldWrap>
            <FieldWrap label="Notify me before" hint="Days ahead">
              <Input type="number" min="0" max="30" value={notifyDaysBefore} onChange={(e) => setNotifyDaysBefore(e.target.value)} />
            </FieldWrap>
          </div>

          <div className="flex items-center justify-between bg-bg-elevated rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">Enable autopay</p>
              <p className="text-xs text-text-muted">
                Charge the selected payment method automatically on the due date.
              </p>
            </div>
            <Switch checked={autopayEnabled} onChange={setAutopayEnabled} label="Enable autopay" />
          </div>

          <FieldWrap label="Notes" hint="Optional">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Anything worth remembering about this payment"
            />
          </FieldWrap>

          <div className="flex justify-between gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => { resetAll(); onClose() }}>
              Cancel
            </Button>
            <Button type="submit">
              Next: Integration <ArrowRight size={14} />
            </Button>
          </div>
        </form>
      ) : (
        // ── Step 2: Integration ──────────────────────────────────────────────
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2">
            {([
              { tier: 'none'   as IntegrationTier, label: 'None',   desc: 'Tracking only', icon: <X      size={14} /> },
              { tier: 'portal' as IntegrationTier, label: 'Portal', desc: 'URL + login',   icon: <Link2  size={14} /> },
              { tier: 'oauth'  as IntegrationTier, label: 'OAuth',  desc: 'Secure token',  icon: <Wifi   size={14} /> },
            ]).map(({ tier, label, desc, icon }) => (
              <button
                key={tier}
                type="button"
                onClick={() => { setIntegrationTier(tier); setOauthConnectionId(undefined) }}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all',
                  integrationTier === tier
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-border bg-bg-elevated text-text-muted hover:border-brand/40',
                )}
              >
                {icon}
                <span className="text-xs font-semibold">{label}</span>
                <span className="text-xs opacity-60">{desc}</span>
              </button>
            ))}
          </div>

          {integrationTier === 'none' && (
            <p className="text-sm text-text-muted text-center py-4">
              No integration — paynest will track this service manually.
            </p>
          )}

          {integrationTier === 'portal' && (
            <PortalCredentialsSection
              portalUrl={portalUrl}
              loginId={loginId}
              loginPassword={loginPassword}
              onPortalUrlChange={setPortalUrl}
              onLoginIdChange={setLoginId}
              onLoginPasswordChange={setLoginPassword}
            />
          )}

          {integrationTier === 'oauth' && !oauthConnectionId && (
            <OAuthConnectFlow
              serviceCategory={category}
              onConnected={(id) => setOauthConnectionId(id)}
              onBack={() => setIntegrationTier('none')}
            />
          )}

          {integrationTier === 'oauth' && oauthConnectionId && (
            <div className="flex items-center gap-3 p-3 bg-success/10 border border-success/25 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-success shrink-0" />
              <p className="text-sm text-success font-medium">OAuth connected</p>
              <button
                type="button"
                onClick={() => setOauthConnectionId(undefined)}
                className="ml-auto text-xs text-text-muted hover:text-text-subtle transition-colors"
              >
                Disconnect
              </button>
            </div>
          )}

          {(integrationTier !== 'oauth' || oauthConnectionId !== undefined) && (
            <div className="flex justify-between gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setStep('details')}>
                <ArrowLeft size={14} /> Back
              </Button>
              <Button type="button" onClick={handleFinalSubmit}>
                Connect service
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
