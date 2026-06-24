import { useState } from 'react'
import { Eye, EyeOff, ExternalLink, ShieldAlert } from 'lucide-react'
import { FieldWrap, Input } from '@/components/ui/Field'

interface PortalCredentialsSectionProps {
  portalUrl: string
  loginId: string
  loginPassword: string
  onPortalUrlChange: (v: string) => void
  onLoginIdChange: (v: string) => void
  onLoginPasswordChange: (v: string) => void
}

export function PortalCredentialsSection({
  portalUrl,
  loginId,
  loginPassword,
  onPortalUrlChange,
  onLoginIdChange,
  onLoginPasswordChange,
}: PortalCredentialsSectionProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 bg-warning/10 border border-warning/25 rounded-xl p-3">
        <ShieldAlert size={16} className="text-warning shrink-0 mt-0.5" />
        <p className="text-xs text-text-muted leading-relaxed">
          <span className="text-warning font-medium">Local storage only.</span>{' '}
          Credentials are saved to your browser and never sent to paynest servers.
          They are not encrypted — avoid using this for critical accounts.
        </p>
      </div>

      <FieldWrap label="Portal URL" hint="Direct link to the provider’s login or payment page">
        <div className="relative">
          <Input
            type="url"
            value={portalUrl}
            onChange={(e) => onPortalUrlChange(e.target.value)}
            placeholder="https://portal.provider.com/login"
          />
          {portalUrl && (
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-brand transition-colors"
              aria-label="Open portal in new tab"
            >
              <ExternalLink size={15} />
            </a>
          )}
        </div>
      </FieldWrap>

      <FieldWrap label="Login ID / Username" hint="Email or username for this portal">
        <Input
          value={loginId}
          onChange={(e) => onLoginIdChange(e.target.value)}
          placeholder="you@email.com"
          autoComplete="off"
        />
      </FieldWrap>

      <FieldWrap label="Password" hint="Stored locally in your browser only">
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={loginPassword}
            onChange={(e) => onLoginPasswordChange(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-subtle transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </FieldWrap>
    </div>
  )
}
