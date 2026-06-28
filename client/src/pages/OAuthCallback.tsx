import { useEffect } from 'react'

/**
 * OAuthCallback — popup landing page for PKCE flows.
 *
 * OAuth providers redirect here after user authorization. This page reads
 * `code` and `state` from the URL, posts them to the parent window via
 * postMessage, and closes the popup.
 *
 * It never touches the auth code itself — the token exchange happens
 * exclusively in the opener (oauth.ts → exchangeCodeForToken).
 */
export default function OAuthCallback() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (window.opener && window.opener !== window) {
      window.opener.postMessage(
        {
          type: 'paynest:oauth:callback',
          code: params.get('code') ?? undefined,
          state: params.get('state') ?? undefined,
          error: params.get('error') ?? undefined,
          errorDescription: params.get('error_description') ?? undefined,
        },
        window.location.origin,
      )
    }

    // Small delay to let the message deliver before closing
    const t = setTimeout(() => window.close(), 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-text-muted">Completing connection…</p>
      </div>
    </div>
  )
}
