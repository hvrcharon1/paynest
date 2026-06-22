export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

export function daysUntil(isoDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(isoDate)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function clampDueDay(day: number): number {
  return Math.min(31, Math.max(1, Math.round(day)))
}

/** Computes the next due date on/after `from` for a given day-of-month + frequency. */
export function computeNextDueDate(dueDay: number, frequency: string, from: Date = new Date()): string {
  const base = new Date(from)
  base.setHours(0, 0, 0, 0)

  const monthsToAdd = frequency === 'quarterly' ? 3 : frequency === 'annually' ? 12 : 1

  const candidate = new Date(base.getFullYear(), base.getMonth(), dueDay)
  if (candidate.getDate() !== dueDay) {
    // overflowed into next month (e.g. Feb 30) — clamp to last day of month
    candidate.setMonth(candidate.getMonth(), 0)
  }

  if (candidate.getTime() >= base.getTime()) {
    return candidate.toISOString().slice(0, 10)
  }

  const next = new Date(base.getFullYear(), base.getMonth() + monthsToAdd, dueDay)
  if (next.getDate() !== dueDay) {
    next.setMonth(next.getMonth(), 0)
  }
  return next.toISOString().slice(0, 10)
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}
