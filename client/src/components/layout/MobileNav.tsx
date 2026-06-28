import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CreditCard, Link2, Sparkles, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const MOBILE_NAV_ITEMS = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/payment-methods', label: 'Methods', icon: CreditCard },
  { to: '/services', label: 'Services', icon: Link2 },
  { to: '/assistant', label: 'Assistant', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-bg-surface border-t border-border flex items-stretch justify-between px-1 pb-[env(safe-area-inset-bottom)]">
      {MOBILE_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium',
              isActive ? 'text-brand-light' : 'text-text-muted'
            )
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
