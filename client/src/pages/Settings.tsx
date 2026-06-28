import { RotateCcw, Github, Info } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/useStore'

export default function Settings() {
  const resetDemoData = useAppStore((s) => s.resetDemoData)
  const clearNotifications = useAppStore((s) => s.clearNotifications)

  return (
    <AppShell title="Settings" subtitle="App preferences and data controls.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Data</CardTitle>
          </CardHeader>
          <p className="text-sm text-text-muted mb-4">
            PayNest stores everything in your browser's local storage. Nothing is sent to a server.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={clearNotifications}>
              Clear notifications
            </Button>
            <Button variant="danger" onClick={resetDemoData}>
              <RotateCcw size={14} /> Reset demo data
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About PayNest</CardTitle>
          </CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <img src="/logo.svg" alt="PayNest" className="h-10 w-10" />
            <div>
              <p className="font-display font-semibold text-text-primary">PayNest</p>
              <p className="text-xs text-text-muted">One nest for every payment you owe.</p>
            </div>
          </div>
          <p className="text-sm text-text-muted flex items-start gap-2">
            <Info size={14} className="shrink-0 mt-0.5" />
            This is a demo build showcasing the product experience. Payment methods and services are simulated
            locally — no real money moves and no real provider accounts are contacted.
          </p>
          <a
            href="https://github.com/hvrcharon1/paynest"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-brand-light hover:underline mt-4"
          >
            <Github size={14} /> View source on GitHub
          </a>
        </Card>
      </div>
    </AppShell>
  )
}
