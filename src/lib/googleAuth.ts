/**
 * Minimal wrapper around Google Identity Services (GIS) for "Sign in with
 * Google" — no backend required.
 *
 * Unlike the bill-provider OAuth connections in `oauthProviders.ts`, this
 * uses GIS's client-side OAuth 2.0 token flow: clicking the button opens
 * Google's consent popup directly (it has to be triggered by a real user
 * gesture), Google hands back a short-lived access token, and we use it
 * once to read the signed-in user's name/email/photo from Google's
 * userinfo endpoint. Only a public Client ID is needed — never a client
 * secret — so this is safe to ship in a purely client-side app.
 *
 * Setup:
 *   1. Create an OAuth 2.0 Client ID (type "Web application") at
 *      https://console.cloud.google.com/apis/credentials
 *   2. Add this app's dev/prod URLs under "Authorized JavaScript origins"
 *   3. Put the Client ID in VITE_GOOGLE_CLIENT_ID in your .env file
 */

export interface GoogleProfile {
  sub: string
  email: string
  emailVerified: boolean
  name: string
  picture?: string
}

interface GoogleTokenResponse {
  access_token?: string
  error?: string
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

let scriptPromise: Promise<void> | null = null

function loadGsiScript(): Promise<void> {
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load Google Identity Services.'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

export function getGoogleClientId(): string | undefined {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID
}

/**
 * Opens Google's account picker / consent popup and resolves with the
 * signed-in user's basic profile once they approve it.
 */
export async function signInWithGoogle(): Promise<GoogleProfile> {
  const clientId = getGoogleClientId()
  if (!clientId) {
    throw new Error(
      'Google sign-in is not configured yet. Add VITE_GOOGLE_CLIENT_ID to your .env file — see .env.example.'
    )
  }

  await loadGsiScript()

  const google = (window as any).google
  if (!google?.accounts?.oauth2) {
    throw new Error('Google Identity Services failed to initialize. Please try again.')
  }

  const accessToken = await new Promise<string>((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (response: GoogleTokenResponse) => {
        if (response.access_token) resolve(response.access_token)
        else reject(new Error(response.error ?? 'Google sign-in was cancelled.'))
      },
      error_callback: (err: { message?: string; type?: string }) => {
        reject(new Error(err?.message ?? 'Google sign-in was cancelled.'))
      },
    })
    client.requestAccessToken()
  })

  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    throw new Error('Signed in with Google, but could not load your profile.')
  }

  const data = await res.json()
  return {
    sub: data.sub,
    email: data.email,
    emailVerified: !!data.email_verified,
    name: data.name ?? data.email,
    picture: data.picture,
  }
}
