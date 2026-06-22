import * as Icons from 'lucide-react'
import { CATEGORY_LIST } from '@/lib/categories'
import type { ServiceCategory } from '@/types'
import { cn } from '@/lib/utils'

interface CategoryFilterProps {
  active: ServiceCategory | 'all'
  onChange: (cat: ServiceCategory | 'all') => void
  counts: Record<string, number>
}

export function CategoryFilter({ active, onChange, counts }: CategoryFilterProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1">
      <button
        onClick={() => onChange('all')}
        className={cn(
          'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
          active === 'all' ? 'bg-brand/15 text-brand-light border-brand/30' : 'text-text-muted border-border hover:text-text-primary'
        )}
      >
        All <span className="opacity-70">{total}</span>
      </button>
      {CATEGORY_LIST.filter(([cat]) => counts[cat]).map(([cat, meta]) => {
        const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[meta.icon] ?? Icons.CircleDollarSign
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              active === cat ? 'bg-brand/15 text-brand-light border-brand/30' : 'text-text-muted border-border hover:text-text-primary'
            )}
          >
            <Icon size={13} />
            {meta.label} <span className="opacity-70">{counts[cat]}</span>
          </button>
        )
      })}
    </div>
  )
}
