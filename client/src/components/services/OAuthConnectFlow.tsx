import { useState } from 'react'
import { CheckCircle2, AlertCircle, ExternalLink, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FieldWrap, Input } from '@/components/ui/Field'
import { OAUTH_PROVIDERS } from '@/lib/oauthProviders'
import { initiateOAuthFlow } from '@/lib/oauth'
import { useAppStore } from '@/store/useStore'
import type { OAuthConnection, OAuthProvider, ServiceCategory } from '@/types'
import { cn } from '@/lib/utils'

interface OAuthConnectFlowProps {
  /** Pre-filters providers to only those covering this category. */
  serviceCategory?: ServiceCategory
  /** Called when a connection is successfully established. */
  onConnected: (connectionId: string) => void
  /** Called when user wants to go back to the tier picker. */
  onBack?: () => void
}

type FlowStep = 'pick' | 'configure' | 'connecting' | 'done' | 'error'

export function OAuthConnectFlow({ serviceCategory, onConnected, onBack }: OAuthConnectFlowProps) {
  const addOAuthConnection = useAppStore((s) => s.addOAuthConnection)

  const [step, setStep] = useState<FlowStep>('pick')
  const [selected, setSelected] = useState<OAuthProvider | null>(null)
  const [clientId, setClientId] = useState('')
  const [customAuthUrl, setCustomAuthUrl] = useState('')
  const [customTokenUrl, setCustomTokenUrl] = useState('')
  const [customScope, setCustomScope] = useState('openid profile')
  const [error, setError] = useState<string | null>(null)

  const providers = serviceCategory
    ? OAUTH_PROVIDERS.filter((p) => p.isCustom || p.categories.includes(serviceCategory))
    : OAUTH_PROVIDERS

  async function handleConnect() {
    if (!selected || !clientId.trim()) return

    const effectiveProvider: OAuthProvider = selected.isCustom
      ? { ...selected, authUrl: customAuthUrl.trim(), tokenUrl: customTokenUrl.trim(), scope: customScope.trim() }
      : selected

    if (selected.isCustom && (!effectiveProvider.authUrl || !effectiveProvider.tokenUrl)) {
      setError('Please fill in both the Authorization URL and the Token URL.')
      return
    }

    setStep('connecting')
    setError(null)

    try {
      const conn: OAuthConnection = await initiateOAuthFlow(effectiveProvider, clientId.trim())
      addOAuthConnection(conn)
      setStep('done')
      onConnected(conn.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error during OAuth flow.')
      setStep('error')
    }
  }

  // ── Provider picker ────────────────────────────────────────────────────────────
  if (step === 'pick') {
    return (
      <div className="space-y-3">
        <p className="text-xs text-text-muted uppercase tracking-wide font-medium">Choose a provider</p>
        <div className="space-y-2">
          {providers.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={p.requiresBackend}
              onClick={() => { setSelected(p); setStep('configure') }}
              className={cn(
                'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                p.requiresBackend
                  ? 'border-border bg-bg-elevated opacity-50 cursor-not-allowed'
                  : 'border-border bg-bg-elevated hover:border-brand cursor-pointer'
              )}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: p.logoColor }}
              >
                {p.logoInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-text-primary">{p.name}</span>
                  {p.requiresBackend && (
                    <span className="text-xs bg-warning/10 text-warning px-1.5 py-0.5 rounded font-medium">
                      Needs backend
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{p.description}</p>
              </div>
            </button>
          ))}
        </div>
        {onBack && (
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={14} /> Back
          </Button>
        )}
      </div>
    )
  }

  // ── Configure ─────────────────────────────────────────────────────────────────
  if (step === 'configure' && selected) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => { setSelected(null); setStep('pick') }}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to providers
        </button>

        <div className="flex items-center gap-3 p-3 bg-bg-elevated rounded-xl border border-border">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: selected.logoColor }}
          >
            {selected.logoInitials}
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{selected.name}</p>
            <p className="text-xs text-text-muted">{selected.description}</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 bg-bg-elevated border border-border rounded-xl p-3">
          <div className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center shrink-0 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success" />
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            <span className="text-text-subtle font-medium">Tokens stay on this device.</span>{' '}
            They are stored in your browser's local storage only and never transmitted to paynest servers.
          </p>
        </div>

        <FieldWrap label="Your OAuth client ID" hint="From this provider’s developer portal — never your client secret">
          <Input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="AaBb0123…"
            autoFocus
          />
        </FieldWrap>

        {selected.isCustom && (
          <div className="space-y-3">
            <FieldWrap label="Authorization URL">
              <Input
                type="url"
                value={customAuthUrl}
                onChange={(e) => setCustomAuthUrl(e.target.value)}
                placeholder="https://provider.com/oauth/authorize"
              />
            </FieldWrap>
            <FieldWrap label="Token URL">
              <Input
                type="url"
                value={customTokenUrl}
                onChange={(e) => setCustomTokenUrl(e.target.value)}
                placeholder="https://provider.com/oauth/token"
              />
            </FieldWrap>
            <FieldWrap label="Scope" hint="Space-separated OAuth scopes">
              <Input
                value={customScope}
                onChange={(e) => setCustomScope(e.target.value)}
                placeholder="openid profile email"
              />
            </FieldWrap>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={() => { setSelected(null); setStep('pick') }}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConnect} disabled={!clientId.trim()}>
            <ExternalLink size={14} /> Connect in popup
          </Button>
        </div>
      </div>
    )
  }

  // ── Connecting ───────────────────────────────────────────────────────────────
  if (step === 'connecting') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">Waiting for authorization…</p>
          <p className="text-xs text-text-muted mt-1">Complete sign-in in the popup, then return here.</p>
        </div>
      </div>
    )
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <CheckCircle2 size={36} className="text-success" />
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary">Connected!</p>
          <p className="text-xs text-text-muted mt-1">{selected?.name} is now linked to this service.</p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-danger/10 border border-danger/20 rounded-xl">
        <AlertCircle size={18} className="text-danger shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-danger">Connection failed</p>
          <p className="text-xs text-text-muted mt-1">{error}</p>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => { setSelected(null); setStep('pick') }}>
          Start over
        </Button>
        <Button type="button" onClick={() => { setError(null); setStep('configure') }}>
          Retry
        </Button>
      </div>
    </div>
  )
}
