import { useMemo } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { ChatPanel } from '@/components/ai/ChatPanel'
import { InsightCard } from '@/components/ai/InsightCard'
import { useAppStore } from '@/store/useStore'
import { generateInsights } from '@/lib/ai'

export default function AIAssistant() {
  const services = useAppStore((s) => s.services)
  const insights = useMemo(() => generateInsights(services), [services])

  return (
    <AppShell title="AI Assistant" subtitle="Ask questions, get predictions, and catch problems early.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChatPanel />
        </div>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Live insights</CardTitle>
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
