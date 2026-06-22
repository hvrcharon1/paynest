import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CreditCard,
  Link2,
  CalendarDays,
  LineChart,
  Sparkles,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/payment-methods', label: 'Payment Methods', icon: CreditCard },
  { to: '/services', label: 'Services', icon: Link2 },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/analytics', label: 'Analytics', icon: LineChart },
  { to: '/assistant', label: 'AI Assistant', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-border bg-bg-surface/60 h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border">
        <img src="/logo.svg" alt="PayNest" className="h-8 w-8" />
        <span className="font-display font-bold text-lg text-text-primary tracking-tight">PayNest</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand/15 text-brand-light border border-brand/25'
                  : 'text-text-subtle hover:text-text-primary hover:bg-bg-elevated border border-transparent'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-border">
        <p className="text-xs text-text-muted leading-relaxed">
          PayNest demo build. Data is stored locally in your browser only.
        </p>
      </div>
    </aside>
  )
}
