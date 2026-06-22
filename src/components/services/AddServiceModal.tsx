import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { FieldWrap, Input, Select, Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { useAppStore } from '@/store/useStore'
import { CATEGORY_LIST } from '@/lib/categories'
import { clampDueDay } from '@/lib/utils'
import type { Frequency, ServiceCategory } from '@/types'

interface AddServiceModalProps {
  open: boolean
  onClose: () => void
}

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
  { value: 'one_time', label: 'One time' },
]

export function AddServiceModal({ open, onClose }: AddServiceModalProps) {
  const paymentMethods = useAppStore((s) => s.paymentMethods)
  const addService = useAppStore((s) => s.addService)

  const [category, setCategory] = useState<ServiceCategory>('rent')
  const [providerName, setProviderName] = useState('')
  const [accountRef, setAccountRef] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('monthly')
  const [dueDay, setDueDay] = useState('1')
  const [autopayEnabled, setAutopayEnabled] = useState(true)
  const [notifyDaysBefore, setNotifyDaysBefore] = useState('3')
  const [notes, setNotes] = useState('')

  function reset() {
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
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!providerName.trim() || !amount || !paymentMethodId) return

    addService({
      category,
      providerName: providerName.trim(),
      accountRef: accountRef.trim(),
      paymentMethodId,
      amount: parseFloat(amount),
      frequency,
      dueDay: clampDueDay(parseInt(dueDay, 10) || 1),
      autopayEnabled,
      notifyDaysBefore: parseInt(notifyDaysBefore, 10) || 3,
      notes: notes.trim() || undefined,
    })
    reset()
    onClose()
  }

  const noPaymentMethods = paymentMethods.length === 0

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Connect a service"
      description="Link any recurring or one-time bill — loans, rent, utilities, insurance, citations, school fees, or paying back a friend."
      widthClass="max-w-lg"
    >
      {noPaymentMethods ? (
        <p className="text-sm text-text-muted">
          Add a payment method first, then come back to connect a service.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldWrap label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value as ServiceCategory)}>
              {CATEGORY_LIST.map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </FieldWrap>

          <FieldWrap label="Provider name" hint="e.g. 'Riverside Apartments' or 'Chase Auto Loan'">
            <Input value={providerName} onChange={(e) => setProviderName(e.target.value)} placeholder="Riverside Apartments" required />
          </FieldWrap>

          <FieldWrap label="Account reference" hint="Account number, unit, policy, or citation #">
            <Input value={accountRef} onChange={(e) => setAccountRef(e.target.value)} placeholder="Unit 14B" />
          </FieldWrap>

          <FieldWrap label="Pay with">
            <Select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.label} (•••• {pm.identifier})
                </option>
              ))}
            </Select>
          </FieldWrap>

          <div className="grid grid-cols-2 gap-4">
            <FieldWrap label="Amount (USD)">
              <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1850.00" required />
            </FieldWrap>
            <FieldWrap label="Frequency">
              <Select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
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
              <p className="text-xs text-text-muted">Charge the selected payment method automatically on the due date.</p>
            </div>
            <Switch checked={autopayEnabled} onChange={setAutopayEnabled} label="Enable autopay" />
          </div>

          <FieldWrap label="Notes" hint="Optional">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything worth remembering about this payment" />
          </FieldWrap>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => { reset(); onClose() }}>
              Cancel
            </Button>
            <Button type="submit">Connect service</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
