import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ExternalService } from '@/types'
import { CATEGORY_META } from '@/lib/categories'
import { cn } from '@/lib/utils'

interface MonthGridProps {
  services: ExternalService[]
  onSelectDay: (isoDate: string) => void
  selectedDate: string | null
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthGrid({ services, onSelectDay, selectedDate }: MonthGridProps) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const servicesByDate = useMemo(() => {
    const map: Record<string, ExternalService[]> = {}
    for (const s of services) {
      if (s.status === 'paused') continue
      map[s.nextDueDate] = [...(map[s.nextDueDate] ?? []), s]
    }
    return map
  }, [services])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayIso = new Date().toISOString().slice(0, 10)

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  function isoFor(day: number) {
    return new Date(year, month, day).toISOString().slice(0, 10)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-text-primary">
          <ChevronLeft size={18} />
        </button>
        <p className="font-display font-semibold text-text-primary">
          {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-bg-elevated text-text-muted hover:text-text-primary">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-text-muted mb-2">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />
          const iso = isoFor(day)
          const dayServices = servicesByDate[iso] ?? []
          const isToday = iso === todayIso
          const isSelected = iso === selectedDate

          return (
            <button
              key={iso}
              onClick={() => onSelectDay(iso)}
              className={cn(
                'aspect-square rounded-xl flex flex-col items-center justify-center gap-1 text-sm border transition-colors',
                isSelected
                  ? 'bg-brand/20 border-brand text-text-primary'
                  : isToday
                  ? 'border-brand/40 text-text-primary'
                  : 'border-transparent text-text-subtle hover:bg-bg-elevated'
              )}
            >
              <span>{day}</span>
              {dayServices.length > 0 && (
                <div className="flex gap-0.5">
                  {dayServices.slice(0, 3).map((s) => (
                    <span key={s.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: CATEGORY_META[s.category].color }} />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
