/**
 * oauth.ts — PKCE utilities for paynest OAuth 2.0 integration
 *
 * Implements Authorization Code + PKCE (RFC 7636) for pure-browser clients.
 * No client_secret ever enters this codebase.
 *
 * Tokens returned from initiateOAuthFlow() are persisted by the Zustand store
 * via addOAuthConnection(). This module only handles PKCE cryptography,
 * popup lifecycle, and the authorization-code exchange.
 */

import type { OAuthConnection, OAuthProvider } from '@/types'
import { generateId } from '@/lib/utils'

// ─── PKCE primitives ─────────────────────────────────────────────────────────

/** Generates a cryptographically random code_verifier (RFC 7636 §4.1). */
export async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(48)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

/** SHA-256 hash of the verifier, base64url-encoded — the code_challenge. */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(digest))
}

/** Cryptographically random state string for CSRF protection. */
export function generateState(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// ─── In-memory PKCE session (cleared on page close) ──────────────────────────

interface PkceSession {
  verifier: string
  state: string
  providerId: string
  clientId: string
  redirectUri: string
}

let _pendingSession: PkceSession | null = null

// ─── Popup configuration ──────────────────────────────────────────────────────

const POPUP_W = 520
const POPUP_H = 640
export const OAUTH_CALLBACK_PATH = '/oauth/callback'

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Launches an OAuth popup using PKCE and resolves with the connection object.
 * Does NOT persist the connection — callers must call store.addOAuthConnection().
 */
export async function initiateOAuthFlow(
  provider: OAuthProvider,
  clientId: string,
): Promise<OAuthConnection> {
  if (provider.requiresBackend) {
    throw new Error(
      `${provider.name} requires a server-side setup (client_secret). ` +
      'This provider cannot be connected directly from the browser.',
    )
  }
  if (!provider.authUrl || !provider.tokenUrl) {
    throw new Error('Provider is missing authUrl or tokenUrl.')
  }

  const verifier = await generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = generateState()
  const redirectUri = `${window.location.origin}${OAUTH_CALLBACK_PATH}`

  // Store verifier in memory only — never in localStorage before use.
  _pendingSession = { verifier, state, providerId: provider.id, clientId, redirectUri }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: provider.scope,
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  const left = Math.round(window.screenX + (window.outerWidth - POPUP_W) / 2)
  const top = Math.round(window.screenY + (window.outerHeight - POPUP_H) / 2)
  const popup = window.open(
    `${provider.authUrl}?${params}`,
    'paynest_oauth',
    `width=${POPUP_W},height=${POPUP_H},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`,
  )

  if (!popup) {
    _pendingSession = null
    throw new Error('Popup was blocked. Please allow popups for this site and try again.')
  }

  return new Promise<OAuthConnection>((resolve, reject) => {
    let settled = false

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (!event.data || event.data.type !== 'paynest:oauth:callback') return

      settled = true
      cleanup()

      const { code, state: returnedState, error } = event.data as {
        type: string
        code?: string
        state?: string
        error?: string
      }

      if (error) {
        _pendingSession = null
        reject(new Error(`OAuth authorization error: ${error}`))
        return
      }

      if (!_pendingSession || returnedState !== _pendingSession.state) {
        _pendingSession = null
        reject(new Error('State mismatch — possible CSRF. Connection aborted.'))
        return
      }

      const session = { ..._pendingSession }
      _pendingSession = null

      exchangeCodeForToken(provider, code!, session.verifier, session.clientId, session.redirectUri)
        .then(resolve)
        .catch(reject)
    }

    // Poll for popup close without completing the flow
    const poll = setInterval(() => {
      if (!settled && popup.closed) {
        settled = true
        cleanup()
        _pendingSession = null
        reject(new Error('OAuth popup was closed before the flow completed.'))
      }
    }, 500)

    function cleanup() {
      window.removeEventListener('message', onMessage)
      clearInterval(poll)
    }

    window.addEventListener('message', onMessage)
  })
}

// ─── Token exchange ───────────────────────────────────────────────────────────

async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string,
  verifier: string,
  clientId: string,
  redirectUri: string,
): Promise<OAuthConnection> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: verifier,
  })

  const res = await fetch(provider.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => `HTTP ${res.status}`)
    throw new Error(`Token exchange failed: ${text}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json()

  return {
    id: generateId('oauth'),
    providerId: provider.id,
    providerName: provider.name,
    clientId,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_in
      ? new Date(Date.now() + (data.expires_in as number) * 1000).toISOString()
      : undefined,
    scope: data.scope ?? provider.scope,
    status: 'active',
    connectedAt: new Date().toISOString(),
    isLocalOnly: true,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true if the token is expired or will expire within 5 minutes. */
export function isExpired(conn: OAuthConnection): boolean {
  if (!conn.expiresAt) return false
  return new Date(conn.expiresAt).getTime() < Date.now() + 5 * 60 * 1000
}
