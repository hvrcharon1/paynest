import { Link2, Wifi, WifiOff } from 'lucide-react'
import type { IntegrationTier, OAuthConnection } from '@/types'
import { isExpired } from '@/lib/oauth'

interface IntegrationBadgeProps {
  tier?: IntegrationTier
  oauthConnection?: OAuthConnection
  /** When true, renders a compact inline badge (no text fallback for 'none'). */
  compact?: boolean
}

export function IntegrationBadge({ tier = 'none', oauthConnection, compact = false }: IntegrationBadgeProps) {
  if (tier === 'none') {
    if (compact) return null
    return (
      <span className="inline-flex items-center gap-1 text-xs text-text-muted">
        No integration
      </span>
    )
  }

  if (tier === 'portal') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs bg-bg-elevated border border-border rounded-full px-2 py-0.5 text-text-subtle">
        <Link2 size={11} />
        {compact ? 'Portal' : 'Portal linked'}
      </span>
    )
  }

  if (tier === 'oauth') {
    if (!oauthConnection) return null

    const dead = isExpired(oauthConnection) || oauthConnection.status !== 'active'

    if (dead) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs bg-warning/10 border border-warning/25 rounded-full px-2 py-0.5 text-warning">
          <WifiOff size={11} />
          {compact ? 'Expired' : `${oauthConnection.providerName} — token expired`}
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-xs bg-success/10 border border-success/25 rounded-full px-2 py-0.5 text-success">
        <Wifi size={11} />
        {compact ? oauthConnection.providerName : `OAuth · ${oauthConnection.providerName}`}
      </span>
    )
  }

  return null
}
