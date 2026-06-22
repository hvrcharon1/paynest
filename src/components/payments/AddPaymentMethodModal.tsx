import { useState, type FormEvent } from 'react'
import { Modal } from '@/components/ui/Modal'
import { FieldWrap, Input, Select } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/useStore'
import type { PaymentMethodType } from '@/types'

interface AddPaymentMethodModalProps {
  open: boolean
  onClose: () => void
}

export function AddPaymentMethodModal({ open, onClose }: AddPaymentMethodModalProps) {
  const addPaymentMethod = useAppStore((s) => s.addPaymentMethod)

  const [type, setType] = useState<PaymentMethodType>('card')
  const [label, setLabel] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [brand, setBrand] = useState('')
  const [expiry, setExpiry] = useState('')
  const [isDefault, setIsDefault] = useState(false)

  function reset() {
    setType('card')
    setLabel('')
    setIdentifier('')
    setBrand('')
    setExpiry('')
    setIsDefault(false)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!label.trim() || !identifier.trim()) return
    addPaymentMethod({ type, label: label.trim(), identifier: identifier.trim(), brand: brand.trim() || undefined, expiry: expiry.trim() || undefined, isDefault })
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Add a payment method" description="Cards, bank accounts, and wallets can all fund autopay on your services.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldWrap label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as PaymentMethodType)}>
            <option value="card">Card</option>
            <option value="bank_account">Bank account</option>
            <option value="wallet">Wallet</option>
          </Select>
        </FieldWrap>

        <FieldWrap label="Label" hint="A name you'll recognize, e.g. 'Everyday Visa'">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Everyday Visa" required />
        </FieldWrap>

        <div className="grid grid-cols-2 gap-4">
          <FieldWrap label={type === 'wallet' ? 'Handle / email' : 'Last 4 digits'}>
            <Input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={type === 'wallet' ? 'me@example.com' : '4821'}
              maxLength={type === 'wallet' ? 40 : 4}
              required
            />
          </FieldWrap>
          <FieldWrap label="Brand" hint="Optional">
            <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="visa, chase, paypal…" />
          </FieldWrap>
        </div>

        {type === 'card' && (
          <FieldWrap label="Expiry" hint="MM/YY, optional">
            <Input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="09/28" maxLength={5} />
          </FieldWrap>
        )}

        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="accent-brand" />
          Make this my default payment method
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={() => { reset(); onClose() }}>
            Cancel
          </Button>
          <Button type="submit">Add method</Button>
        </div>
      </form>
    </Modal>
  )
}
