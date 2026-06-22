import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { ForecastPoint } from '@/types'
import { formatCurrency } from '@/lib/utils'

export function ForecastChart({ data }: { data: ForecastPoint[] }) {
  const chartData = data.map((p) => ({
    month: new Date(p.month + '-01').toLocaleDateString('en-US', { month: 'short' }),
    predicted: p.predicted,
  }))

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: '#94A3B8' }}
            itemStyle={{ color: '#F1F5F9' }}
          />
          <Area type="monotone" dataKey="predicted" stroke="#8B5CF6" strokeWidth={2} fill="url(#forecastGradient)" name="Predicted spend" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
