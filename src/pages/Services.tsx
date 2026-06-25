import { useMemo, useState } from 'react'
import { Plus, Link2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/Button'
import { ServiceCard } from '@/components/services/ServiceCard'
import { AddServiceModal } from '@/components/services/AddServiceModal'
import { CategoryFilter } from '@/components/services/CategoryFilter'
import { useAppStore } from '@/store/useStore'
import type { ServiceCategory } from '@/types'

export default function Services() {
  const services = useAppStore((s) => s.services)
  const paymentMethods = useAppStore((s) => s.paymentMethods)
  const oauthConnections = useAppStore((s) => s.oauthConnections)
  const toggleAutopay = useAppStore((s) => s.toggleAutopay)
  const updateService = useAppStore((s) => s.updateService)
  const removeService = useAppStore((s) => s.removeService)
  const markPaid = useAppStore((s) => s.markPaid)

  const [modalOpen, setModalOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'all'>('all')

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const s of services) c[s.category] = (c[s.category] ?? 0) + 1
    return c
  }, [services])

  const filtered = activeCategory === 'all' ? services : services.filter((s) => s.category === activeCategory)

  function handlePauseToggle(id: string) {
    const svc = services.find((s) => s.id === id)
    if (!svc) return
    updateService(id, { status: svc.status === 'paused' ? 'active' : 'paused' })
  }

  return (
    <AppShell title="Services" subtitle="Every external bill connected to your payment methods.">
      <div className="flex flex-col gap-4 mb-5">
        <div className="flex justify-between items-start gap-4">
          <CategoryFilter active={activeCategory} onChange={setActiveCategory} counts={counts} />
          <Button onClick={() => setModalOpen(true)} className="shrink-0">
            <Plus size={16} /> Connect service
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <Link2 className="mx-auto mb-3 opacity-50" size={32} />
          <p className="text-sm">No services in this category yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((svc) => (
            <ServiceCard
              key={svc.id}
              service={svc}
              paymentMethod={paymentMethods.find((pm) => pm.id === svc.paymentMethodId)}
              oauthConnection={oauthConnections.find((c) => c.id === svc.oauthConnectionId)}
              onToggleAutopay={toggleAutopay}
              onPauseToggle={handlePauseToggle}
              onRemove={removeService}
              onMarkPaid={markPaid}
            />
          ))}
        </div>
      )}

      <AddServiceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </AppShell>
  )
}
