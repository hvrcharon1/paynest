import { useMemo } from 'react'
import { Wallet, CalendarClock, ShieldCheck, TrendingUp } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatCard } from '@/components/dashboard/StatCard'
import { PaymentHealthRing } from '@/components/dashboard/PaymentHealthRing'
import { UpcomingList } from '@/components/dashboard/UpcomingList'
import { InsightCard } from '@/components/ai/InsightCard'
import { useAppStore } from '@/store/useStore'
import { paymentHealthScore, totalMonthlyOutflow, generateInsights } from '@/lib/ai'
import { formatCurrency } from '@/lib/utils'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const services = useAppStore((s) => s.services)
  const paymentMethods = useAppStore((s) => s.paymentMethods)

  const score = useMemo(() => paymentHealthScore(services), [services])
  const monthlyTotal = useMemo(() => totalMonthlyOutflow(services), [services])
  const insights = useMemo(() => generateInsights(services).slice(0, 3), [services])

  const autopayCount = services.filter((s) => s.autopayEnabled).length
  const overdueCount = services.filter((s) => s.status === 'overdue').length

  return (
    <AppShell title="Dashboard" subtitle="Your full payment picture, in one nest.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* health ring + quick stats */}
        <Card className="lg:col-span-1 flex flex-col items-center justify-center text-center">
          <PaymentHealthRing score={score} services={services} />
          <p className="text-sm text-text-muted mt-4 max-w-[220px]">
            {score >= 85
              ? 'Your bills are well covered. Keep autopay on for the rest.'
              : score >= 60
              ? 'A few bills need attention — check who is missing autopay.'
              : 'Several bills are at risk. Review overdue items now.'}
          </p>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <StatCard label="Monthly recurring spend" value={formatCurrency(monthlyTotal)} icon={Wallet} hint={`${services.length} active services`} />
          <StatCard
            label="Autopay coverage"
            value={`${autopayCount}/${services.length}`}
            icon={ShieldCheck}
            tone={autopayCount === services.length ? 'success' : 'warning'}
            hint="Services on autopay"
          />
          <StatCard
            label="Overdue"
            value={String(overdueCount)}
            icon={CalendarClock}
            tone={overdueCount > 0 ? 'danger' : 'success'}
            hint={overdueCount > 0 ? 'Needs attention' : 'Nothing overdue'}
          />
          <StatCard label="Payment methods" value={String(paymentMethods.length)} icon={TrendingUp} hint="Linked and ready" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming payments</CardTitle>
            <Link to="/calendar" className="text-xs text-brand-light hover:underline">
              View calendar
            </Link>
          </CardHeader>
          <UpcomingList services={services} limit={6} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI insights</CardTitle>
            <Link to="/assistant" className="text-xs text-brand-light hover:underline">
              Ask AI
            </Link>
          </CardHeader>
          <div className="space-y-3">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  )
}
