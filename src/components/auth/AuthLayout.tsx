import { ReactNode } from 'react'
import { ShieldCheck, BellRing, Sparkles } from 'lucide-react'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

const FEATURES = [
  { icon: ShieldCheck, text: 'One health score for every bill you owe' },
  { icon: BellRing, text: 'Reminders before anything goes overdue' },
  { icon: Sparkles, text: 'AI insights that forecast your cash flow' },
]

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-bg">
      {/* Decorative brand panel — hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/35 via-bg to-bg" />
        <div className="absolute -top-24 -left-20 w-[26rem] h-[26rem] rounded-full bg-brand/25 blur-3xl animate-float-slow" />
        <div className="absolute bottom-[-6rem] right-[-4rem] w-[30rem] h-[30rem] rounded-full bg-brand-light/15 blur-3xl animate-float" />
        <div className="absolute top-1/3 right-10 w-40 h-40 rounded-full bg-success/10 blur-3xl animate-float-slow" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="PayNest" className="h-10 w-10" />
            <span className="font-display font-bold text-2xl text-text-primary tracking-tight">PayNest</span>
          </div>

          <div className="space-y-8 max-w-md">
            <h2 className="font-display text-4xl font-bold text-text-primary leading-tight">
              One nest for every payment you owe.
            </h2>
            <p className="text-text-subtle text-base leading-relaxed">
              Cards, loans, rent, utilities, subscriptions — PayNest brings every bill under one
              roof, with autopay and AI watching your cash flow around the clock.
            </p>
            <ul className="space-y-4">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-text-subtle">
                  <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-brand/15 border border-brand/25 text-brand-light shrink-0">
                    <Icon size={17} />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-text-muted">
            © 2024–2026 Datacules LLC. Your data stays private — never sold, never shared.
          </p>
        </div>
      </div>

      {/* Form panel — scrollable so tall forms (e.g. Signup) never clip */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex lg:hidden items-center gap-2.5 mb-8 justify-center">
            <img src="/logo.svg" alt="PayNest" className="h-9 w-9" />
            <span className="font-display font-bold text-xl text-text-primary">PayNest</span>
          </div>

          <div className="bg-bg-surface border border-border rounded-2xl p-7 sm:p-8 shadow-glow">
            <div className="mb-6 text-center">
              <h1 className="font-display text-2xl font-bold text-text-primary">{title}</h1>
              <p className="text-sm text-text-muted mt-1.5">{subtitle}</p>
            </div>

            {children}
          </div>

          <div className="mt-6 text-center text-sm text-text-muted">{footer}</div>
        </div>
      </div>
    </div>
  )
}
