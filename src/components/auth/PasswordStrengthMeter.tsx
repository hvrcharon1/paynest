import { checkPasswordStrength } from '@/lib/auth'
import { cn } from '@/lib/utils'

const BAR_COLOR: Record<number, string> = {
  1: 'bg-danger',
  2: 'bg-warning',
  3: 'bg-brand-light',
  4: 'bg-success',
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null
  const { score, label, issues } = checkPasswordStrength(password)

  return (
    <div className="mt-2.5">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              i < score ? BAR_COLOR[score] : 'bg-border'
            )}
          />
        ))}
      </div>
      <p className="text-xs text-text-muted mt-1.5">
        {label}
        {issues.length > 0 && score < 4 && ` — needs ${issues.join(', ').toLowerCase()}`}
      </p>
    </div>
  )
}
