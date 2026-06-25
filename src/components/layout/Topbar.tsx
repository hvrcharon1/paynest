import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/store/useStore'
import { useAuthStore } from '@/store/useAuthStore'
import { cn, initials } from '@/lib/utils'
import { formatDistanceToNow } from '@/lib/format'

interface TopbarProps {
  title: string
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const notifications = useAppStore((s) => s.notifications)
  const markNotificationRead = useAppStore((s) => s.markNotificationRead)
  const [open, setOpen] = useState(false)

  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  function handleSignOut() {
    setMenuOpen(false)
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-8 border-b border-border bg-bg/80 backdrop-blur sticky top-0 z-30">
      <div className="flex items-center gap-2 md:hidden">
        <img src="/logo.svg" alt="PayNest" className="h-7 w-7" />
      </div>

      <div>
        <h1 className="font-display text-lg md:text-xl font-semibold text-text-primary">{title}</h1>
        {subtitle && <p className="text-xs md:text-sm text-text-muted mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Notifications"
            className="relative p-2 rounded-xl hover:bg-bg-elevated transition-colors text-text-subtle hover:text-text-primary"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 rounded-full bg-danger text-white text-[10px] leading-4 text-center font-semibold">
                {unreadCount}
              </span>
            )}
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto scrollbar-thin bg-bg-surface border border-border rounded-2xl shadow-2xl z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-display text-sm font-semibold text-text-primary">Notifications</p>
                </div>
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-text-muted text-center">You're all caught up.</p>
                ) : (
                  <ul>
                    {notifications.map((n) => (
                      <li
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={cn(
                          'px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-bg-elevated transition-colors',
                          !n.read && 'bg-brand/5'
                        )}
                      >
                        <p className="text-sm font-medium text-text-primary">{n.title}</p>
                        <p className="text-xs text-text-muted mt-0.5">{n.message}</p>
                        <p className="text-[11px] text-text-muted/70 mt-1">{formatDistanceToNow(n.createdAt)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        {user && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-xl hover:bg-bg-elevated transition-colors"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <span className="h-7 w-7 rounded-full bg-brand/20 border border-brand/30 text-brand-light text-xs font-semibold flex items-center justify-center">
                  {initials(user.name) || user.email[0]?.toUpperCase()}
                </span>
              )}
              <span className="hidden sm:block text-sm font-medium text-text-primary max-w-[120px] truncate">
                {user.name}
              </span>
              <ChevronDown size={14} className="text-text-muted hidden sm:block" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-bg-surface border border-border rounded-2xl shadow-2xl z-50 animate-fade-in overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
                    <p className="text-xs text-text-muted truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger-light hover:bg-danger/10 transition-colors"
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
