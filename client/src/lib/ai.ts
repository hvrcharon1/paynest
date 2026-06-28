import type { AIInsight, ExternalService, ForecastPoint } from '@/types'
import { CATEGORY_META } from '@/lib/categories'
import { daysUntil, formatCurrency, generateId } from '@/lib/utils'

/**
 * Everything in this file runs entirely on the client against local data.
 * It's intentionally framed as a swappable "AI provider" — see
 * `README.md -> Wiring up real AI` for how to replace these heuristics
 * with live calls to the Claude API (e.g. claude-sonnet-4-6) once a
 * backend proxy holds the API key.
 */

function monthlyEquivalent(service: ExternalService): number {
  switch (service.frequency) {
    case 'weekly':
      return service.amount * 4.33
    case 'biweekly':
      return service.amount * 2.17
    case 'quarterly':
      return service.amount / 3
    case 'annually':
      return service.amount / 12
    case 'one_time':
      return 0
    default:
      return service.amount
  }
}

export function totalMonthlyOutflow(services: ExternalService[]): number {
  return services
    .filter((s) => s.status !== 'paused')
    .reduce((sum, s) => sum + monthlyEquivalent(s), 0)
}

export function spendByCategory(services: ExternalService[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const s of services) {
    if (s.status === 'paused') continue
    map[s.category] = (map[s.category] ?? 0) + monthlyEquivalent(s)
  }
  return map
}

/** Simple 6-month forward forecast with mild seasonal noise, anchored to current monthly spend. */
export function buildForecast(services: ExternalService[]): ForecastPoint[] {
  const base = totalMonthlyOutflow(services)
  const points: ForecastPoint[] = []
  const seasonality = [1, 1.02, 0.98, 1.05, 1.1, 1.03] // mild winter/summer utility bump
  const today = new Date()

  for (let i = 0; i < 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const month = d.toISOString().slice(0, 7)
    const predicted = Math.round(base * seasonality[i % seasonality.length])
    points.push({ month, predicted, actual: i === 0 ? Math.round(base) : undefined })
  }
  return points
}

/** Payment-health score 0-100: penalizes overdue items and services without autopay near their due date. */
export function paymentHealthScore(services: ExternalService[]): number {
  if (services.length === 0) return 100
  let score = 100
  for (const s of services) {
    if (s.status === 'overdue') score -= 14
    else if (!s.autopayEnabled && daysUntil(s.nextDueDate) <= s.notifyDaysBefore) score -= 5
  }
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Generates a handful of analyst-style insights from current service data:
 * upcoming-cash-flow risk, anomalies vs. category norms, and autopay gaps.
 */
export function generateInsights(services: ExternalService[]): AIInsight[] {
  const insights: AIInsight[] = []
  const now = new Date().toISOString()

  // 1. Cash-flow risk: cluster of due dates within 5 days
  const soon = services.filter((s) => daysUntil(s.nextDueDate) >= 0 && daysUntil(s.nextDueDate) <= 5)
  if (soon.length >= 3) {
    const total = soon.reduce((sum, s) => sum + s.amount, 0)
    insights.push({
      id: generateId('insight'),
      title: `${soon.length} payments cluster in the next 5 days`,
      detail: `${formatCurrency(total)} is due across ${soon.map((s) => s.providerName).join(', ')}. Make sure your funding account can cover this short-term spike.`,
      severity: 'warning',
      generatedAt: now,
    })
  }

  // 2. Autopay gaps on bills due soon
  const noAutopaySoon = services.filter((s) => !s.autopayEnabled && daysUntil(s.nextDueDate) <= 4 && daysUntil(s.nextDueDate) >= 0)
  for (const s of noAutopaySoon) {
    insights.push({
      id: generateId('insight'),
      title: `${s.providerName} has no autopay set up`,
      detail: `Due in ${daysUntil(s.nextDueDate)} day${daysUntil(s.nextDueDate) === 1 ? '' : 's'} for ${formatCurrency(s.amount)}. Turn on autopay to avoid a missed payment.`,
      severity: 'info',
      category: s.category,
      generatedAt: now,
    })
  }

  // 3. Overdue
  const overdue = services.filter((s) => s.status === 'overdue')
  for (const s of overdue) {
    insights.push({
      id: generateId('insight'),
      title: `${s.providerName} payment is overdue`,
      detail: `${formatCurrency(s.amount)} was due ${Math.abs(daysUntil(s.nextDueDate))} day(s) ago. Late penalties may apply — pay now or contact the provider.`,
      severity: 'critical',
      category: s.category,
      generatedAt: now,
    })
  }

  // 4. Category concentration callout
  const byCat = spendByCategory(services)
  const totalSpend = Object.values(byCat).reduce((a, b) => a + b, 0)
  const sortedCats = Object.entries(byCat).sort((a, b) => b[1] - a[1])
  if (sortedCats.length > 0 && totalSpend > 0) {
    const [topCat, topAmount] = sortedCats[0]
    if (topAmount / totalSpend > 0.35) {
      insights.push({
        id: generateId('insight'),
        title: `${CATEGORY_META[topCat as keyof typeof CATEGORY_META].label} is your largest recurring cost`,
        detail: `It accounts for ${Math.round((topAmount / totalSpend) * 100)}% of your monthly recurring spend (${formatCurrency(topAmount)} of ${formatCurrency(totalSpend)}).`,
        severity: 'info',
        category: topCat as keyof typeof CATEGORY_META,
        generatedAt: now,
      })
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: generateId('insight'),
      title: 'Everything looks on track',
      detail: 'No overdue bills, no near-term cash clusters, and autopay is covering your due dates well.',
      severity: 'info',
      generatedAt: now,
    })
  }

  return insights
}

/** Lightweight intent matcher for the AI Assistant chat — keyword-based, no network call required. */
export function answerLocalQuery(query: string, services: ExternalService[]): string {
  const q = query.toLowerCase()

  const matchByName = services.find((s) => q.includes(s.providerName.toLowerCase().split(' ')[0]))
  const matchByCategory = services.find((s) => q.includes(CATEGORY_META[s.category].label.toLowerCase().split(' ')[0]))
  const match = matchByName ?? matchByCategory

  if (/next|when|due/.test(q) && match) {
    return `Your next ${match.providerName} payment of ${formatCurrency(match.amount)} is due on ${match.nextDueDate} (in ${daysUntil(match.nextDueDate)} day(s)).`
  }

  if (/total|spend|month|outflow/.test(q)) {
    return `Your projected recurring spend this month is ${formatCurrency(totalMonthlyOutflow(services))} across ${services.length} services.`
  }

  if (/overdue|late/.test(q)) {
    const overdue = services.filter((s) => s.status === 'overdue')
    return overdue.length
      ? `You have ${overdue.length} overdue payment(s): ${overdue.map((s) => s.providerName).join(', ')}.`
      : `Nothing is overdue right now — nicely on top of it.`
  }

  if (/autopay/.test(q)) {
    const enabled = services.filter((s) => s.autopayEnabled).length
    return `Autopay is on for ${enabled} of ${services.length} services. Want me to flag the ones without it?`
  }

  if (match) {
    return `${match.providerName}: ${formatCurrency(match.amount)} ${match.frequency.replace('_', ' ')}, due on day ${match.dueDay}, autopay is ${match.autopayEnabled ? 'on' : 'off'}.`
  }

  return `I can answer questions about due dates, totals, overdue bills, and autopay status. Try asking "when's my next rent payment?" or "what's overdue?".`
}
