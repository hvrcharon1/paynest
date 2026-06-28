import { useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { PaymentMethodCard } from '@/components/payments/PaymentMethodCard'
import { AddPaymentMethodModal } from '@/components/payments/AddPaymentMethodModal'
import { useAppStore } from '@/store/useStore'

export default function PaymentMethods() {
  const paymentMethods = useAppStore((s) => s.paymentMethods)
  const services = useAppStore((s) => s.services)
  const setDefaultPaymentMethod = useAppStore((s) => s.setDefaultPaymentMethod)
  const removePaymentMethod = useAppStore((s) => s.removePaymentMethod)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <AppShell title="Payment Methods" subtitle="Cards, bank accounts, and wallets you can pay with.">
      <div className="flex justify-end mb-5">
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Add payment method
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <Wallet className="mx-auto mb-3 opacity-50" size={32} />
          <p className="text-sm">No payment methods yet. Add one to start setting up autopay.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethods.map((pm) => (
            <PaymentMethodCard
              key={pm.id}
              method={pm}
              onSetDefault={setDefaultPaymentMethod}
              onRemove={removePaymentMethod}
              linkedCount={services.filter((s) => s.paymentMethodId === pm.id).length}
            />
          ))}
        </div>
      )}

      <AddPaymentMethodModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </AppShell>
  )
}
