import { useMemo } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { CategoryBreakdownChart } from '@/components/analytics/CategoryBreakdownChart'
import { ForecastChart } from '@/components/analytics/ForecastChart'
import { InsightCard } from '@/components/ai/InsightCard'
import { useAppStore } from '@/store/useStore'
import { spendByCategory, buildForecast, generateInsights, totalMonthlyOutflow } from '@/lib/ai'
import { formatCurrency } from '@/lib/utils'

export default function Analytics() {
  const services = useAppStore((s) => s.services)

  const byCategory = useMemo(() => spendByCategory(services), [services])
  const forecast = useMemo(() => buildForecast(services), [services])
  const insights = useMemo(() => generateInsights(services), [services])
  const monthlyTotal = useMemo(() => totalMonthlyOutflow(services), [services])

  return (
    <AppShell title="Analytics" subtitle="Where your money goes, and where it's headed.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spend by category</CardTitle>
          </CardHeader>
          <CategoryBreakdownChart data={byCategory} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6-month forecast</CardTitle>
            <span className="text-xs text-text-muted">~{formatCurrency(monthlyTotal)}/mo now</span>
          </CardHeader>
          <ForecastChart data={forecast} />
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>All AI insights</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </Card>
    </AppShell>
  )
}
