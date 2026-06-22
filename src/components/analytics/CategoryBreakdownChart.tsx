import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { CATEGORY_META } from '@/lib/categories'
import { formatCurrency } from '@/lib/utils'
import type { ServiceCategory } from '@/types'

interface CategoryBreakdownChartProps {
  data: Record<string, number>
}

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const chartData = Object.entries(data)
    .map(([cat, amount]) => ({
      name: CATEGORY_META[cat as ServiceCategory].label,
      value: Math.round(amount * 100) / 100,
      color: CATEGORY_META[cat as ServiceCategory].color,
    }))
    .sort((a, b) => b.value - a.value)

  if (chartData.length === 0) {
    return <p className="text-sm text-text-muted text-center py-10">No spending data yet.</p>
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 12, fontSize: 12 }}
            itemStyle={{ color: '#F1F5F9' }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2 max-h-28 overflow-y-auto scrollbar-thin">
        {chartData.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-text-muted truncate">
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="truncate">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
