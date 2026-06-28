import { useMemo, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { MonthGrid } from '@/components/calendar/MonthGrid'
import { UpcomingList } from '@/components/dashboard/UpcomingList'
import { useAppStore } from '@/store/useStore'

export default function CalendarPage() {
  const services = useAppStore((s) => s.services)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const dayServices = useMemo(
    () => (selectedDate ? services.filter((s) => s.nextDueDate === selectedDate) : []),
    [services, selectedDate]
  )

  return (
    <AppShell title="Calendar" subtitle="See every due date across all your connected services.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <MonthGrid services={services} onSelectDay={setSelectedDate} selectedDate={selectedDate} />
        </Card>

        <Card>
          <p className="font-display font-semibold text-text-primary mb-3">
            {selectedDate
              ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              : 'All upcoming payments'}
          </p>
          <UpcomingList services={selectedDate ? dayServices : services} limit={selectedDate ? undefined : 10} />
        </Card>
      </div>
    </AppShell>
  )
}
